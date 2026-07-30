const express = require("express");
const supabase = require("../lib/supabase");
const VALID_CATEGORIES = require("../lib/categories");

const router = express.Router();

router.get("/", async (req, res) => {
	const { user_id, limit = "12", offset = "0" } = req.query;

	const pageSize = Math.min(Math.max(Number(limit) || 12, 1), 50);
	const pageOffset = Math.max(Number(offset) || 0, 0);

	let query = supabase
		.from("activities")
		.select("*, photos(*), users(full_name), children:activities!parent_id(*, photos(*))", {
			count: "exact",
		})
		.is("parent_id", null)
		.order("created_at", { ascending: false })
		.range(pageOffset, pageOffset + pageSize - 1);
	if (user_id) query = query.eq("user_id", user_id);

	const { data, error, count } = await query;
	if (error) return res.status(400).json({ error: error.message });
	res.json({ data, count, limit: pageSize, offset: pageOffset });
});

router.get("/:id", async (req, res) => {
	const { data, error } = await supabase
		.from("activities")
		.select("*, photos(*), children:activities!parent_id(*, photos(*))")
		.eq("id", req.params.id)
		.single();
	if (error) return res.status(404).json({ error: error.message });
	res.json(data);
});

router.post("/", async (req, res) => {
	const { user_id, category, caption, parent_id } = req.body;
	if (!user_id || !category) {
		return res.status(400).json({ error: "user_id and category required" });
	}
	if (!VALID_CATEGORIES.includes(category)) {
		return res
			.status(400)
			.json({
				error: `category must be one of: ${VALID_CATEGORIES.join(", ")}`,
			});
	}

	const insertData = { user_id, category, caption };
	if (parent_id) insertData.parent_id = parent_id;

	const { data, error } = await supabase
		.from("activities")
		.insert(insertData)
		.select()
		.single();
	if (error) return res.status(400).json({ error: error.message });
	res.status(201).json(data);
});

router.put("/:id", async (req, res) => {
	const { category, caption } = req.body;
	if (category && !VALID_CATEGORIES.includes(category)) {
		return res
			.status(400)
			.json({
				error: `category must be one of: ${VALID_CATEGORIES.join(", ")}`,
			});
	}

	const update = {};
	if (category) update.category = category;
	if (caption !== undefined) update.caption = caption;

	const { data, error } = await supabase
		.from("activities")
		.update(update)
		.eq("id", req.params.id)
		.select()
		.single();
	if (error) return res.status(400).json({ error: error.message });
	res.json(data);
});

async function removeStorageFolder(activityId) {
	const { data: files, error: listError } = await supabase.storage
		.from("photos")
		.list(activityId);
	if (!listError && files?.length) {
		const paths = files.map((f) => `${activityId}/${f.name}`);
		await supabase.storage.from("photos").remove(paths);
	}
}

router.delete("/:id", async (req, res) => {
	const activityId = req.params.id;

	const { data: activity, error: fetchError } = await supabase
		.from("activities")
		.select("id, parent_id, points")
		.eq("id", activityId)
		.single();
	if (fetchError) return res.status(404).json({ error: fetchError.message });

	// Non-anchor categories in a multi-category submission are children of the
	// anchor row — they can't be deleted on their own, only with the whole submission.
	if (activity.parent_id) {
		return res.status(400).json({
			error: "Tidak bisa menghapus aktivitas ini secara terpisah. Hapus aktivitas utamanya.",
		});
	}

	const { data: children } = await supabase
		.from("activities")
		.select("id, points")
		.eq("parent_id", activityId);

	// Once the admin has awarded points anywhere in this submission, it's locked
	// from deletion — otherwise a user could erase the record behind the points.
	if (activity.points > 0 || (children || []).some((c) => c.points > 0)) {
		return res.status(400).json({
			error: "Aktivitas ini sudah diberi poin dan tidak bisa dihapus.",
		});
	}

	// Photos are uploaded under a storage folder named after the activity id
	// (see routes/photos.js upload path) — remove the actual files first,
	// otherwise deleting the rows just orphans them in the bucket forever.
	await removeStorageFolder(activityId);
	for (const child of children || []) {
		await removeStorageFolder(child.id);
	}

	const { error } = await supabase
		.from("activities")
		.delete()
		.eq("id", activityId);
	if (error) return res.status(400).json({ error: error.message });
	res.status(204).send();
});

module.exports = router;
