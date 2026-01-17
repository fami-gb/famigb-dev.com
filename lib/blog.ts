import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// path of 'content/'
const postsDirectory = path.join(process.cwd(), 'content');

export async function getBlogData(slug: string) {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  // gray-matterでメタデータと本文を分離
  const { content, data } = matter(fileContents);

  return {
    slug,
    content,
    frontmatter: data,
  };
}

export function getAllPosts() {
  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames.map((fileName) => {
    // Remove ".md" from file name to get id
    const slug = fileName.replace(/\.md$/, '');

    // Read markdown file as string
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');

    // Use gray-matter to parse the post metadata section
    const { data } = matter(fileContents);

    // Combine the data with the id
    return {
      slug,
      ...(data as { title: string; date: string }),
    };
  });
  // Sort posts by date
  return allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });
}
