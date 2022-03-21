import { Model, DataTypes } from "sequelize";

import connection from "../DBConnect";
class HeroCheck extends Model {}
HeroCheck.init(
  {
    tx_hash: {
      type: DataTypes.STRING,
    },
    block_number: {
      type: DataTypes.DECIMAL,
    },
    token_id: {
      type: DataTypes.STRING,
    },
    is_correct: {
      type: DataTypes.BOOLEAN,
    },
  },
  {
    // Other model options go here
    sequelize: connection, // We need to pass the connection instance
    modelName: "HeroCheck", // We need to choose the model name
    indexes: [
      {
        fields: ["tx_hash", "token_id"],
        unique: true,
      },
    ],
  },
);

export default HeroCheck;
