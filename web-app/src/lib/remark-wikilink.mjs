export function remarkWikiLink() {
  return (tree) => {
    function walk(node) {
      if (!node.children) return;
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (child.type === 'text') {
          const value = child.value;
          // Matches [[Link Target]] or [[Link Target|Link Label]]
          const regex = /\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/g;
          if (regex.test(value)) {
            regex.lastIndex = 0;
            const newChildren = [];
            let lastIndex = 0;
            let match;
            while ((match = regex.exec(value)) !== null) {
              let textBefore = value.slice(lastIndex, match.index);
              let isImage = false;
              if (textBefore.endsWith('!')) {
                isImage = true;
                textBefore = textBefore.slice(0, -1);
              }
              if (textBefore) {
                newChildren.push({ type: 'text', value: textBefore });
              }
              const target = match[1].trim();
              const label = (match[2] !== undefined ? match[2] : target).trim();
              
              if (isImage) {
                let filename = target;
                if (filename.includes('/')) {
                  filename = filename.split('/').pop();
                }
                const base = '/Dani-s-Backyard';
                const imageUrl = `${base}/_attachments/${encodeURIComponent(filename)}`;
                newChildren.push({
                  type: 'image',
                  url: imageUrl,
                  title: null,
                  alt: label || filename
                });
              } else {
                // If target starts with "Chapter ", route to /chapters/slug
                // Otherwise route to /almanac/slug
                const isChapter = target.toLowerCase().startsWith('chapter');
                
                // Generate a clean URL-friendly slug
                const slug = target
                  .toLowerCase()
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '') // remove accents
                  .replace(/[^a-z0-9\s-]/g, '')     // remove non-alphanumeric except space and hyphen
                  .trim()
                  .replace(/[\s_]+/g, '-')          // replace spaces with hyphens
                  .replace(/-+/g, '-');             // replace multiple hyphens with single
                
                const base = '/Dani-s-Backyard';
                const pathPrefix = isChapter ? `${base}/chapters` : `${base}/almanac`;
                
                newChildren.push({
                  type: 'link',
                  url: `${pathPrefix}/${slug}`,
                  children: [{ type: 'text', value: label }]
                });
              }
              lastIndex = regex.lastIndex;
            }
            const textAfter = value.slice(lastIndex);
            if (textAfter) {
              newChildren.push({ type: 'text', value: textAfter });
            }
            node.children.splice(i, 1, ...newChildren);
            i += newChildren.length - 1;
          }
        } else {
          walk(child);
        }
      }
    }
    walk(tree);
  };
}
