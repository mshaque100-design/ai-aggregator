// Lazy Prisma client — only connects when DATABASE_URL is set
type PrismaClientType = import("@prisma/client").PrismaClient;

let _prisma: PrismaClientType | undefined = undefined;

export async function db(): Promise<PrismaClientType | undefined> {
  if (!process.env.DATABASE_URL) return undefined;
  if (!_prisma) {
    try {
      const mod = await import("@prisma/client");
      _prisma = new mod.PrismaClient();
    } catch {
      return undefined;
    }
  }
  return _prisma;
}