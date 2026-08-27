const ExpenseCategory = require("../models/ExpenseCategory");

async function list(req, res, next) {
  try {
    res.json({ categories: await ExpenseCategory.findAllByUser(req.user.id) });
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const { name, type } = req.body;
    const existing = await ExpenseCategory.findAllByUser(req.user.id);
    if (existing.some((c) => c.name.toLowerCase() === name.trim().toLowerCase()))
      return res.status(409).json({ message: "A category with that name already exists" });

    const category = await ExpenseCategory.create(req.user.id, { name: name.trim(), type });
    res.status(201).json({ category });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const current = await ExpenseCategory.findById(req.params.id, req.user.id);
    if (!current) return res.status(404).json({ message: "Category not found" });
    const category = await ExpenseCategory.update(req.params.id, req.user.id, {
      name: (req.body.name ?? current.name).trim(),
      type: req.body.type ?? current.type,
    });
    res.json({ category });
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const ok = await ExpenseCategory.remove(req.params.id, req.user.id);
    if (!ok) return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Category deleted" });
  } catch (err) { next(err); }
}

/** Restores any missing default categories for the logged-in user. */
async function restoreDefaults(req, res, next) {
  try {
    const existing = await ExpenseCategory.findAllByUser(req.user.id);
    const names = existing.map((c) => c.name.toLowerCase());
    const missing = ExpenseCategory.DEFAULT_CATEGORIES.filter(
      (c) => !names.includes(c.name.toLowerCase())
    );
    for (const c of missing) await ExpenseCategory.create(req.user.id, c);
    res.json({ added: missing.length, categories: await ExpenseCategory.findAllByUser(req.user.id) });
  } catch (err) { next(err); }
}

module.exports = { list, create, update, remove, restoreDefaults };
