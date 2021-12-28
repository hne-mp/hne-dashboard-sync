import { Model, DataTypes } from "sequelize";

import connection from "../DBConnect";
export interface IGear {
  token_id: string;
  name: string;
  type: string;
  class: string;
  tier: string;
  tier_basic: string;
  is_burned: boolean;
  owner: string;
  tx_hash: string;
  block_number: number;
}
class Gear extends Model {}
Gear.init(
  {
    token_id: {
      type: DataTypes.STRING,
    },
    name: {
      type: DataTypes.STRING,
    },
    type: {
      type: DataTypes.STRING,
    },
    class: {
      type: DataTypes.STRING,
    },
    tier: {
      type: DataTypes.STRING,
    },
    tier_basic: {
      type: DataTypes.STRING,
    },
    is_burned: {
      type: DataTypes.BOOLEAN,
    },
    owner: {
      type: DataTypes.STRING,
    },
    tx_hash: {
      type: DataTypes.STRING,
    },
    block_number: {
      type: DataTypes.DECIMAL,
    },
  },
  {
    // Other model options go here
    sequelize: connection, // We need to pass the connection instance
    modelName: "Gear", // We need to choose the model name
    indexes: [
      {
        fields: ["name"],
      },
      {
        fields: ["type"],
      },
      {
        fields: ["class"],
      },
      {
        fields: ["tier"],
      },
      {
        fields: ["tier_basic"],
      },
      {
        fields: ["is_burned"],
      },
      {
        fields: ["owner"],
      },
      {
        fields: ["block_number"],
      },
      {
        fields: ["token_id", "tx_hash"],
        unique: true,
      },
    ],
  },
);
export type GearDocument = Gear & IGear;
export default Gear;
