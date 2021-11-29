import { Model, DataTypes } from "sequelize";

import connection from "../DBConnect";
class Logs extends Model {}
Logs.init(
  {
    message: {
      type: DataTypes.TEXT,
    },
    type: {
      type: DataTypes.STRING(10),
    },
  },
  {
    // Other model options go here
    sequelize: connection, // We need to pass the connection instance
    modelName: "Logs", // We need to choose the model name
    indexes: [
      {
        fields: ["type"],
      },
    ],
  },
);

export default Logs;
