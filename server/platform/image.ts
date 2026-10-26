import { DomainError } from "./errors";

export async function verifyImage(file: File): Promise<void> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const signature = (offset: number, values: number[]) =>
    values.every((value, index) => bytes[offset + index] === value);
  const valid =
    file.type === "image/jpeg"
      ? signature(0, [0xff, 0xd8, 0xff])
      : file.type === "image/png"
        ? signature(0, [137, 80, 78, 71, 13, 10, 26, 10])
        : file.type === "image/webp" &&
          signature(0, [82, 73, 70, 70]) &&
          signature(8, [87, 69, 66, 80]);
  if (!valid)
    throw new DomainError(
      "invalid",
      "This file is not a valid JPG, PNG or WebP image.",
    );
}
