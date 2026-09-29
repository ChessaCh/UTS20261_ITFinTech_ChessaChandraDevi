const imageNameMap = {
  "cheesecake.jpg": "cheese-cake.jpg",
  "coffee.jpg": "hot-coffee.jpg",
  "matcha-latte.jpg": "hot-matcha-latte.jpg",
};

export function getProductImagePath(imageUrl) {
  if (!imageUrl) return "";

  const fileName = imageUrl.split("/").pop();
  return `/images/${imageNameMap[fileName] || fileName}`;
}
