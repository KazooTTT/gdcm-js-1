import { serve } from "@hono/node-server";
import { Hono } from "hono";
import JSZip from "jszip";
import * as gdcm from "./app.cjs";

const app = new Hono();

// 处理 DICOM 文件压缩的 API 端点
app.post("/api/compress", async (c) => {
  try {
    const formData = await c.req.formData();
    const files = formData.getAll("files");

    if (!files || files.length === 0) {
      return c.json({ error: "没有上传文件" }, 400);
    }

    // 处理所有文件
    const compressedFiles = await Promise.all(
      files.map(async (file, index) => {
        console.log("%c Line:21 🥟 file", "color:#7f2b82", file);
        const arrayBuffer = await file.arrayBuffer();
        const dicomData = new Uint8Array(arrayBuffer);

        // 为每个文件准备唯一的输入输出文件名
        const inputName = `input_${index}.dcm`;
        const outputName = `output_${index}.dcm`;

        // 准备内存文件系统
        const memfs = [{ name: inputName, data: dicomData }];

        // 执行压缩
        const result = gdcm.gdcmconv({
          MEMFS: memfs,
          arguments: ["--jpeg", "-q", "80", "-i", inputName, "-o", outputName],
        });

        // 检查结果
        if (!result.MEMFS || !result.MEMFS[0]) {
          throw new Error(`压缩文件 ${file.name} 失败`);
        }

        return {
          filename: file.name,
          data: result.MEMFS[0].data,
        };
      })
    );

    // 如果只有一个文件，保持原来的行为
    if (compressedFiles.length === 1) {
      return new Response(compressedFiles[0].data, {
        headers: {
          "Content-Type": "application/dicom",
          "Content-Disposition": `attachment; filename="${compressedFiles[0].filename}"`,
        },
      });
    }

    // 如果有多个文件，返回ZIP文件
    const zip = new JSZip();
    compressedFiles.forEach((file) => {
      zip.file(file.filename, file.data);
    });

    const zipContent = await zip.generateAsync({ type: "uint8array" });
    return new Response(zipContent, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="compressed_files.zip"',
      },
    });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// 启动服务器
const port = 3000;
console.log(`Server is running on port ${port}`);
serve({
  fetch: app.fetch,
  port,
});
