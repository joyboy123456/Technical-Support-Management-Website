-- 创建图片存储表
CREATE TABLE IF NOT EXISTS images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    mimetype VARCHAR(100) NOT NULL,
    data BYTEA NOT NULL,
    size INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at);
CREATE INDEX IF NOT EXISTS idx_images_mimetype ON images(mimetype);

-- 添加更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 删除已存在的触发器（如果存在）
DROP TRIGGER IF EXISTS update_images_updated_at ON images;

-- 创建触发器
CREATE TRIGGER update_images_updated_at 
    BEFORE UPDATE ON images 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 添加注释
COMMENT ON TABLE images IS '图片存储表';
COMMENT ON COLUMN images.id IS '图片唯一标识';
COMMENT ON COLUMN images.filename IS '原始文件名';
COMMENT ON COLUMN images.mimetype IS 'MIME类型';
COMMENT ON COLUMN images.data IS '图片二进制数据';
COMMENT ON COLUMN images.size IS '文件大小（字节）';
COMMENT ON COLUMN images.created_at IS '创建时间';
COMMENT ON COLUMN images.updated_at IS '更新时间';