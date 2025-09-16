import db from "../config/db.js";

export const addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await db.query(
      "INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *",
      [name, description]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM categories ORDER BY id DESC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const result = await db.query(
      "UPDATE categories SET name=$1, description=$2 WHERE id=$3 RETURNING *",
      [name, description, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM categories WHERE id=$1", [id]);
    res.json({ message: "Xóa danh mục thành công" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
