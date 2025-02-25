import fs from "fs";
import gdcm from "./app.js";

var dicomoriginal = new Uint8Array(fs.readFileSync("0000.dcm"));
var memfs = [{ name: "input.dcm", data: dicomoriginal }];

// 先查看文件信息
gdcm.gdcmconv({ MEMFS: memfs, arguments: ["-i", "input.dcm"] });

var result = gdcm.gdcmconv({
  MEMFS: memfs,
  arguments: ["-i", "input.dcm", "-o", "output.dcm"],
});

console.log("%c Line:11 🍖 result", "color:#2eafb0", result);

fs.writeFileSync("output1.dcm", result.MEMFS[0].data);
