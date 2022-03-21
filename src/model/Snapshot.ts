import { Model, DataTypes } from "sequelize";

import connection from "../DBConnect";
class Snapshot extends Model {}
Snapshot.init(
  {
    key: {
      type: DataTypes.STRING,
    },
    group: {
      type: DataTypes.STRING,
    },
    value: {
      type: DataTypes.STRING,
    },
  },
  {
    // Other model options go here
    sequelize: connection, // We need to pass the connection instance
    modelName: "Snapshot", // We need to choose the model name
  },
);

export default Snapshot;
