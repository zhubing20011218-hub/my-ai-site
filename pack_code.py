import os

# 配置：想要包含的文件后缀
ALLOWED_EXTENSIONS = {'.html', '.css', '.js', '.jsx', '.ts', '.tsx', '.vue', '.json', '.py', '.md'}
# 配置：想要忽略的目录
IGNORE_DIRS = {'node_modules', '.git', 'dist', 'build', 'coverage', '__pycache__'}
# 配置：想要忽略的文件
IGNORE_FILES = {'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'}

def pack_project():
    output_file = 'project_all_code.txt'
    
    with open(output_file, 'w', encoding='utf-8') as outfile:
        # 遍历当前目录
        for root, dirs, files in os.walk('.'):
            # 修改 dirs 列表以跳过忽略的目录
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            
            for file in files:
                if file in IGNORE_FILES:
                    continue
                    
                ext = os.path.splitext(file)[1].lower()
                if ext in ALLOWED_EXTENSIONS:
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as infile:
                            content = infile.read()
                            # 写入文件路径作为标题
                            outfile.write(f"\n\n{'='*50}\n")
                            outfile.write(f"File Path: {file_path}\n")
                            outfile.write(f"{'='*50}\n\n")
                            outfile.write(content)
                            print(f"已添加: {file_path}")
                    except Exception as e:
                        print(f"读取错误 {file_path}: {e}")

    print(f"\n完成！所有代码已合并到: {output_file}")
    print("请把这个 txt 文件发给 Gemini。")

if __name__ == '__main__':
    pack_project()