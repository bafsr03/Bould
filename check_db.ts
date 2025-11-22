import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const productId = "gid://shopify/Product/10064890822970";
    console.log(`Querying for product: ${productId}`);

    const record = await prisma.conversion.findFirst({
        where: { shopifyProductId: productId }
    });

    if (record) {
        console.log("Found record:");
        console.log(JSON.stringify(record, null, 2));
    } else {
        console.log("No record found for this product.");
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
