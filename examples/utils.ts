import { BytesLike, ethers } from "ethers";

export function someRandomPcrs(): [BytesLike, BytesLike, BytesLike] {
    const pcr0 = ethers.hexlify(ethers.randomBytes(48));
    const pcr1 = ethers.hexlify(ethers.randomBytes(48));
    const pcr2 = ethers.hexlify(ethers.randomBytes(48));
    return [pcr0, pcr1, pcr2];
  }

  export function getImageId(pcrs: [BytesLike, BytesLike, BytesLike]): BytesLike {
    let digest = ethers.keccak256(rlpedPcrs(pcrs));
    return digest;
  }

  export function rlpedPcrs(pcrs: [BytesLike, BytesLike, BytesLike]): BytesLike {
    let encoded = ethers.solidityPacked(["bytes", "bytes", "bytes"], [pcrs[0], pcrs[1], pcrs[2]]);
    return encoded;
  }