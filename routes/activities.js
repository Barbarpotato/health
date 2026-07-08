const express = require("express");
const supabase = require("../lib/supabase");
const VALID_CATEGORIES = require("../lib/categories");

const router = express.Router();

router.get("/", async (req, res) => {
	const { user_id } = req.query;
	let query = supabase
		.from("activities")
		.select("*, photos(*), users(full_name)")
		.order("created_at", { ascending: false });
	if (user_id) query = query.eq("user_id", user_id);

	const { data, error } = await query;
	if (error) return res.status(400).json({ error: error.message });
	res.json(data);
});

router.get("/:id", async (req, res) => {
	const { data, error } = await supabase
		.from("activities")
		.select("*, photos(*)")
		.eq("id", req.params.id)
		.single();
	if (error) return res.status(404).json({ error: error.message });
	res.json(data);
});

router.post("/", async (req, res) => {
	const { user_id, category, caption } = req.body;
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

	const { data, error } = await supabase
		.from("activities")
		.insert({ user_id, category, caption })
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

router.delete("/:id", async (req, res) => {
	const { error } = await supabase
		.from("activities")
		.delete()
		.eq("id", req.params.id);
	if (error) return res.status(400).json({ error: error.message });
	res.status(204).send();
});

module.exports = router;
