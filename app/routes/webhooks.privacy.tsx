import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    const { shop, payload, topic } = await authenticate.webhook(request);

    console.log(`Received ${topic} webhook for ${shop}`);

    switch (topic) {
        case "shop/redact": {
            const shopDomain = shop;
            console.log(`[GDPR] Redacting data for shop: ${shopDomain}`);

            try {
                // 1. Delete Shop Plan
                await (db as any).shopPlan.deleteMany({
                    where: { shopDomain },
                });

                // 2. Delete Conversions (and cascade WidgetEvents if relation exists, otherwise delete manually)
                // Note: WidgetEvent has a relation to Conversion, so we might need to delete events first 
                // if cascade isn't set up in DB, but Prisma usually handles it if configured. 
                // However, schema doesn't show onDelete: Cascade. Let's be safe.

                // Find conversions to get IDs if needed, or just delete events by shopDomain
                await (db as any).widgetEvent.deleteMany({
                    where: { shopDomain },
                });

                await (db as any).conversion.deleteMany({
                    where: { shopDomain },
                });

                // 3. Delete Sessions (should be gone from uninstalled, but good to ensure)
                await (db as any).session.deleteMany({
                    where: { shop },
                });

                console.log(`[GDPR] Successfully redacted data for ${shopDomain}`);
            } catch (error) {
                console.error(`[GDPR] Error redacting data for ${shopDomain}`, error);
            }
            break;
        }

        case "customers/redact":
        case "customers/data_request": {
            // We do not currently store end-customer PII (email, phone, address) in our database.
            // WidgetEvents are anonymous usage logs.
            // If we add customer tracking in the future, we must implement this.
            console.log(`[GDPR] Received ${topic} for ${shop}. No customer PII stored to redact/export.`);
            break;
        }

        default:
            break;
    }

    return new Response();
};
