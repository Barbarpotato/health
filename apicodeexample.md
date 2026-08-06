<?php

class image_controller extends Controller
{

    function __construct()
    {
        parent::__construct();

        // ** get the user from session
        $this->user = Session::get("user");
    }

    private function upload_image($absolute_path = "", $file = "", $generated_id = "")
    {

        if (empty($absolute_path) || empty($file)) {
            throw new Exception("Invalid Parameter Function");
        }

        // Get the uploaded file from the form
        $img_file = $_FILES["file"];

        // ** Validate the file is found or not
        if ($img_file['error'] !== UPLOAD_ERR_OK) {
            throw new Exception("Something went wrong while uploading the image file.");
        }

        // Get the file details
        $fileName = $img_file['name'];
        $fileExtension = pathinfo($fileName, PATHINFO_EXTENSION);

        // ** Check if it's a Image file. If it is not, reject the request
        if (strtolower($fileExtension) !== 'jpg' && strtolower($fileExtension) !== 'jpeg' && strtolower($fileExtension) !== 'png') {
            throw new Exception("Invalid file type. Only Image files are allowed.");
        }

        // ** Move the uploaded file to a specific directory
        // Set the destination folder above channel_api (using absolute path)
        $destinationDir = $absolute_path;

        // Create a unique file name in case of conflicts
        if (empty($generated_id)) {
            $image_id = uniqid('', true) . "." . time();
        } else {
            $image_id = $generated_id;
        }
        $destinationPath = $destinationDir . $image_id . '-' . basename($fileName);

        // Move the file to the destination directory
        if (move_uploaded_file($img_file['tmp_name'], $destinationPath)) {
            return array("path" => $destinationPath, "image_id" => $image_id);
        } else {
            throw new Exception("Failed to save the uploaded file.");
        }
    }


    // ** -----------------------------
    // ** POST METHOD **
    // ** -----------------------------


    public function create()
    {

        // get the body request data
        $title = $_POST["title"];
        $description = $_POST["description"];
        $keyword = $_POST["keyword"];

        if (empty($title) || empty($description) || empty($keyword)) {
            push_application_error(array("", "Invalid Request Data."));
            return;
        }

        $this->model->db->beginTransaction();
        try {

            // load the engine
            $metadata_engine = load_engine("metadata", $this->model->db);

            // upload the image to Image directory
            $image = $this->upload_image(IMAGE_DIRECTORY, $_FILES["file"]);

            $path = $image["path"];
            $image_id = $image["image_id"];

            if (empty($path) || empty($image_id)) {
                throw new Exception("Something went wrong with the image upload.");
            }

            // save the metadata to the database
            $save_data = array();
            $save_data["title"] = $title;
            $save_data["description"] = $description;
            $save_data["keyword"] = $keyword;
            $save_data["image_id"] = $image_id;
            $save_data["file_path"] = $path;
            $save_data["public"] = $_POST["public"] ? $_POST["public"] : 0;
            $metadata_engine->metadata_save($save_data, $this->user["id"], $this->user["username"]);

            // send the json response
            $this->generate_api_response(array("image_id" => $image_id));

            // commit
            $this->model->db->commit();
        } catch (Exception $e) {
            $this->model->db->rollBack();
            push_application_error(array("", $e->getMessage()));
            return;
        }
    }


    // ** -----------------------------
    // ** GET METHOD **
    // ** -----------------------------


    public function fetch_link($image_id, $image_width = 700, $image_height = 700, $image_access_type = "token")
    {

        // make sure the image id is not empty
        if (empty($image_id)) {
            push_application_error(array("", "Invalid Image ID."));
            return;
        }

        // **
        // allowed image_access_type
        $allowed_image_access_type = array("token", "public");
        if (!in_array($image_access_type, $allowed_image_access_type)) {
            push_application_error(array("", "Bad Request."));
            return;
        }

        $this->model->db->beginTransaction();
        try {

            // load the engine
            $request_engine = load_engine("request", $this->model->db);
            $metadata_engine = load_engine("metadata", $this->model->db);

            // generate the token for the client request
            $token =  uniqid('', true) . "." . time();

            // get the image_id from the metadata based on the image_id
            $filters = array();
            $filters["public"] = $image_access_type == "token" ? 0 : 1;
            $filters["image_id"] = $image_id;
            $metadata = $metadata_engine->metadata_get_list($filters);
            if (count($metadata) == 0) {
                throw new Exception("Image not found.");
            }
            $metadata = $metadata[0];

            // save the token to request obejct
            $save_data = array();
            $save_data["token"] = $token;
            $save_data["width_request"] = $image_width;
            $save_data["height_request"] = $image_height;
            $save_data["request_image_id"] = $metadata["image_id"];
            $save_data["expiration_date"] = (new DateTime())->modify('+1 hours')->format('Y-m-d H:i:s');
            $request_save = $request_engine->request_save($save_data, $this->user["id"], $this->user["username"]);

            // generated the url
            $url = "";
            if ($image_access_type == "token") $url = SERVER_DIRECTORY . "/?token=" . $token;
            if ($image_access_type == "public") $url = SERVER_DIRECTORY . "/?public=" . $image_id . "&width=" . $image_width . "&height=" . $image_height;

            // send the json response
            $this->generate_api_response(array(
                "url" => $url,
                "title" => $metadata["title"],
                "description" => $metadata["description"],
                "keyword" => $metadata["keyword"]
            ));

            $this->model->db->commit();
        } catch (Exception $e) {
            $this->model->db->rollBack();
            push_application_error(array("", $e->getMessage()));
            return;
        }
    }


    // ** -----------------------------
    // ** PUT METHOD **
    // ** -----------------------------


    public function update()
    {
        // get the body request data
        $title = $_POST["title"];
        $description = $_POST["description"];
        $keyword = $_POST["keyword"];

        if (empty($title) || empty($description) || empty($keyword)) {
            push_application_error(array("", "Invalid Request Data."));
            return;
        }

        // get the old image id data
        $image_id = $_POST["image_id"];
        if (empty($image_id)) {
            push_application_error(array("", "Invalid Image ID."));
            return;
        }

        try {

            $metadata_engine = load_engine("metadata", $this->model->db);

            // validate the image id from the server
            $filters = array();
            $filters["image_id"] = $image_id;
            $metadata = $metadata_engine->metadata_get_list($filters);
            if (count($metadata) == 0) {
                throw new Exception("Image not found.");
            }

            $this->model->db->beginTransaction();

            if (count($metadata) === 1) {
                $metadata = $metadata[0];

                // **
                // -- attempting to delete the old image file from dir.
                // -- Delete metadata image from the database
                $save_data = array();
                $save_data["id"] = $metadata["id"];
                $metadata_engine->metadata_delete($save_data);

                // Delete the image file
                $file_path = $metadata["file_path"];
                if (file_exists($file_path)) {
                    if (!unlink($file_path)) {
                        push_application_error(array("", "Invalid Request Data."));
                        return;
                    }
                }

                // ** 
                // -- attempting to store new image data to dir
                // -- upload the image to Image directory
                $image = $this->upload_image(IMAGE_DIRECTORY, $_FILES["file"]);

                $path = $image["path"];
                $new_image_id = $image["image_id"];

                if (empty($path) || empty($new_image_id)) {
                    push_application_error(array("", "Invalid Request Data."));
                    return;
                }

                // save the metadata image to the database
                $save_data = array();
                $save_data["title"] = $title;
                $save_data["description"] = $description;
                $save_data["keyword"] = $keyword;
                $save_data["image_id"] = $new_image_id;
                $save_data["file_path"] = $path;
                $save_data["public"] = $_POST["public"] ? $_POST["public"] : 0;
                $metadata_engine->metadata_save($save_data, $this->user["id"], $this->user["username"]);

                // send the json response
                $this->model->db->commit();
                $this->generate_api_response(array("image_id" => $new_image_id));
            }
        } catch (Exception $e) {
            $this->model->db->rollBack();
            push_application_error(array("", $e->getMessage()));
            return;
        }
    }


    // ** -----------------------------
    // ** DELETE METHOD **
    // ** -----------------------------

    public function delete($image_id)
    {
        if (empty($image_id)) {
            push_application_error(array("", "Invalid Image ID."));
            return;
        }

        // Load the metadata engine
        $metadata_engine = load_engine("metadata", $this->model->db);

        try {
            $this->model->db->beginTransaction();

            // Fetch the metadata for the image
            $filters = array();
            $filters["image_id"] = $image_id;
            $metadata = $metadata_engine->metadata_get_list($filters);
            if (count($metadata) === 1) {
                $metadata = $metadata[0];


                // Delete metadata from the database
                $save_data = array();
                $save_data["id"] = $metadata["id"];
                $metadata_engine->metadata_delete($save_data);

                // Delete the image file
                $file_path = $metadata["file_path"];
                if (file_exists($file_path)) {
                    if (!unlink($file_path)) {
                        throw new Exception("Failed to delete the image file.");
                    }
                }
            }

            // Return success response
            $this->generate_api_response(array("status" => "deleted", "image_id" => $image_id));

            $this->model->db->commit();
        } catch (Exception $e) {
            $this->model->db->rollBack();
            push_application_error(array("", $e->getMessage()));
            return;
        }
    }


    // **
    // MOCKUP:
    // {
    //   "image_id": ["img_001", "img_002"]
    // }
    public function delete_list()
    {
        // Parse POST data (JSON or form-encoded)
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        if (!is_array($data)) {
            $data = $_POST;
        }

        // Validate image_id field
        if (!isset($data["image_id"])) {
            push_application_error(array("", "Missing image_id."));
            return;
        }

        $image_ids = $data["image_id"];
        if (!is_array($image_ids)) {
            $image_ids = array($image_ids);
        }

        if (empty($image_ids)) {
            push_application_error(array("", "Image ID list is empty."));
            return;
        }

        // Load the metadata engine
        $metadata_engine = load_engine("metadata", $this->model->db);

        try {
            $this->model->db->beginTransaction();

            $deleted = array();
            foreach ($image_ids as $id) {
                if (empty($id)) {
                    continue;
                }

                $filters = array();
                $filters["image_id"] = $id;
                $metadata = $metadata_engine->metadata_get_list($filters);

                if (count($metadata) === 1) {
                    $metadata = $metadata[0];

                    // Delete metadata
                    $save_data = array();
                    $save_data["id"] = $metadata["id"];
                    $metadata_engine->metadata_delete($save_data);

                    // Delete image file
                    $file_path = $metadata["file_path"];
                    if (file_exists($file_path)) {
                        if (!unlink($file_path)) {
                            throw new Exception("Failed to delete file: " . $file_path);
                        }
                    }

                    $deleted[] = $id;
                }
            }

            $this->model->db->commit();

            $this->generate_api_response(array("status" => "deleted", "image_ids" => $deleted));
        } catch (Exception $e) {
            $this->model->db->rollBack();
            push_application_error(array("", $e->getMessage()));
            return;
        }
    }
}
