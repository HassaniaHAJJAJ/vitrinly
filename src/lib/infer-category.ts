const RULES: [string, string[]][] = [
  ["Robes",            ["robe", "combinaison"]],
  ["Hauts",            ["pull", "sweat", "t-shirt", "tshirt", "chemise", "top", "blouse", "débardeur", "crop", "gilet", "tunique", "polo"]],
  ["Bas",              ["pantalon", "jean", "short", "jupe", "legging", "jogging", "cargo", "bermuda"]],
  ["Vestes & Manteaux",["veste", "manteau", "blouson", "blazer", "parka", "trench", "cardigan", "doudoune"]],
  ["Chaussures",       ["chaussure", "basket", "botte", "sandale", "espadrille", "mocassin", "talon", "sneaker", "bottine", "derby"]],
  ["Accessoires",      ["sac", "ceinture", "chapeau", "écharpe", "bijou", "collier", "bracelet", "bague", "lunette", "bonnet", "foulard", "pochette", "montre", "casquette"]],
  ["Maillots de bain", ["maillot", "bikini", "monokini"]],
  ["Lingerie",         ["soutien", "brassière", "culotte", "string", "lingerie", "nuisette"]],
];

export function inferCategory(name: string): string | null {
  const lower = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  for (const [category, keywords] of RULES) {
    if (keywords.some((kw) => lower.includes(kw.normalize("NFD").replace(/[̀-ͯ]/g, "")))) {
      return category;
    }
  }
  return null;
}
