/**
 * 查询并显示当前数据库中的所有设备数据
 */

const { Client } = require("pg");

const connectionString =
  "postgresql://postgres:Yxmsx123321.@sbp-a2e2xuudcasoe44t.supabase.opentrust.net:5432/postgres";

async function showCurrentData() {
  const client = new Client({ connectionString });

  try {
    console.log("🔌 正在连接到数据库...");
    await client.connect();
    console.log("✅ 连接成功！\n");

    // 查询所有设备
    const devicesResult = await client.query(`
      SELECT id, name, model, serial, printer_model_field, location, owner, status,
             cover_image, images, next_maintenance,
             printer_model, printer_paper, printer_connect, printer_paper_stock,
             printer_ink_c, printer_ink_m, printer_ink_y, printer_ink_k
      FROM devices
      ORDER BY name
    `);

    console.log("📋 当前数据库中的设备：\n");
    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    );

    devicesResult.rows.forEach((device, index) => {
      console.log(`\n【设备 ${index + 1}】`);
      console.log(`  ID: ${device.id}`);
      console.log(`  名称: ${device.name}`);
      console.log(`  型号: ${device.model}`);
      console.log(`  序列号: ${device.serial}`);
      console.log(`  打印机型号: ${device.printer_model}`);
      console.log(`  位置: ${device.location}`);
      console.log(`  负责人: ${device.owner}`);
      console.log(`  状态: ${device.status}`);
      console.log(`  封面图: ${device.cover_image || "无"}`);

      // 安全解析 images 字段
      let imageCount = 0;
      try {
        if (device.images && device.images !== "") {
          const imagesArray =
            typeof device.images === "string"
              ? JSON.parse(device.images)
              : device.images;
          imageCount = Array.isArray(imagesArray) ? imagesArray.length : 0;
        }
      } catch (e) {
        console.log(`  ⚠️  相册图片解析错误: ${e.message}`);
      }
      console.log(`  相册图片数: ${imageCount}`);
      console.log(`  纸张: ${device.printer_paper}`);
      console.log(`  连接方式: ${device.printer_connect}`);
      console.log(`  纸张库存: ${device.printer_paper_stock} 张`);
      console.log(
        `  墨水 (CMYK): ${device.printer_ink_c}%, ${device.printer_ink_m}%, ${device.printer_ink_y}%, ${device.printer_ink_k}%`,
      );
      console.log(`  下次维护: ${device.next_maintenance}`);
    });

    console.log(
      "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    );
    console.log(`\n总计: ${devicesResult.rows.length} 台设备`);

    // 查询维护日志统计
    const logsResult = await client.query(`
      SELECT device_id, COUNT(*) as count
      FROM maintenance_logs
      GROUP BY device_id
      ORDER BY device_id
    `);

    console.log("\n📝 维护日志统计：");
    logsResult.rows.forEach((row) => {
      const deviceName =
        devicesResult.rows.find((d) => d.id === row.device_id)?.name ||
        row.device_id;
      console.log(`  ${deviceName}: ${row.count} 条记录`);
    });

    // 查询故障记录
    const issuesResult = await client.query(`
      SELECT device_id, COUNT(*) as count
      FROM issues
      GROUP BY device_id
      ORDER BY device_id
    `);

    if (issuesResult.rows.length > 0) {
      console.log("\n⚠️  故障记录：");
      issuesResult.rows.forEach((row) => {
        const deviceName =
          devicesResult.rows.find((d) => d.id === row.device_id)?.name ||
          row.device_id;
        console.log(`  ${deviceName}: ${row.count} 条记录`);
      });
    }

    console.log("\n");
  } catch (error) {
    console.error("❌ 查询失败：", error.message);
  } finally {
    await client.end();
  }
}

showCurrentData();
