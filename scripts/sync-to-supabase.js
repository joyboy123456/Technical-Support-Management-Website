/**
 * 将本地 devices.ts 中的数据同步到 Supabase 数据库
 * 这个脚本会读取本地的设备数据并更新到数据库中
 */

const { Client } = require("pg");

const connectionString =
  "postgresql://postgres:Yxmsx123321.@sbp-a2e2xuudcasoe44t.supabase.opentrust.net:5432/postgres";

// 从 devices.ts 手动提取的设备数据（包含图片信息）
const devicesToSync = [
  {
    id: "dev-01",
    name: "魔镜1号",
    coverImage:
      "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80",
    images: [
      "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800&dpr=2&q=80",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&dpr=2&q=80",
      "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800&dpr=2&q=80",
    ],
  },
  {
    id: "dev-02",
    name: "魔镜2号",
    coverImage:
      "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800&dpr=2&q=80",
    images: [
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&dpr=2&q=80",
      "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80",
    ],
  },
  {
    id: "dev-03",
    name: "魔镜3号",
    coverImage:
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&dpr=2&q=80",
    images: [],
  },
  // 如果其他设备也有图片，请在这里继续添加
];

async function syncToSupabase() {
  const client = new Client({ connectionString });

  try {
    console.log("🔌 正在连接到数据库...");
    await client.connect();
    console.log("✅ 连接成功！\n");

    console.log("📤 开始同步设备图片数据...\n");

    for (const device of devicesToSync) {
      console.log(`正在更新: ${device.name} (${device.id})`);

      // 将 images 数组转换为 JSON 字符串
      const imagesJson = JSON.stringify(device.images || []);

      // 更新数据库中的图片信息
      const result = await client.query(
        `
        UPDATE devices
        SET
          cover_image = $1,
          images = $2::jsonb
        WHERE id = $3
        RETURNING id, name, cover_image
      `,
        [device.coverImage, imagesJson, device.id],
      );

      if (result.rows.length > 0) {
        console.log(`  ✅ ${device.name} 更新成功`);
        console.log(`     封面图: ${device.coverImage ? "已设置" : "无"}`);
        console.log(`     相册: ${device.images.length} 张图片`);
      } else {
        console.log(`  ⚠️  未找到设备 ${device.id}`);
      }
      console.log("");
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`✅ 同步完成！共更新 ${devicesToSync.length} 台设备`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // 验证更新结果
    console.log("🔍 验证更新结果...\n");
    const verifyResult = await client.query(
      `
      SELECT id, name, cover_image, images
      FROM devices
      WHERE id = ANY($1)
      ORDER BY id
    `,
      [devicesToSync.map((d) => d.id)],
    );

    verifyResult.rows.forEach((row) => {
      const imagesArray = row.images
        ? typeof row.images === "string"
          ? JSON.parse(row.images)
          : row.images
        : [];
      console.log(`${row.name}:`);
      console.log(`  封面: ${row.cover_image ? "✅" : "❌"}`);
      console.log(`  相册: ${imagesArray.length} 张`);
    });
  } catch (error) {
    console.error("❌ 同步失败：", error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

syncToSupabase();
