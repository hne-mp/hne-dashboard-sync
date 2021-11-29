import { SequelizeUniqueConstraintError } from "../constant";

export async function updateOrCreate(model: any, where: any, newItem: any) {
  // First try to find the record
  const foundItem = await model.findOne({ where: where });
  if (!foundItem) {
    // Item not found, create a new one
    let item;
    try {
      item = await model.create(newItem);
      return { item, created: true };
    } catch (error) {
      if (error.name !== SequelizeUniqueConstraintError) {
        throw error;
      }
    }
  }
  // Found an item, update it
  const item = await model.update(newItem, { where });
  return { item, created: false };
}

export async function createIfNotExist(model: any, where: any, newItem: any) {
  // First try to find the record
  const foundItem = await model.findOne({ where: where });
  if (!foundItem) {
    // Item not found, create a new one
    let item;
    try {
      item = await model.create(newItem);
      return { item, created: true };
    } catch (error) {
      if (error.name !== SequelizeUniqueConstraintError) {
        throw error;
      }
    }
  }
  return null;
}
