import PackageNFT from "../model/PackageNFT";
class PackageNFTService {
  async getLatestBlock(): Promise<number> {
    return await PackageNFT.max("block_number");
  }
}
export default PackageNFTService;
