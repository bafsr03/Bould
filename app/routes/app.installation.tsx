import {
  Box,
  Card,
  Layout,
  Link,
  List,
  Page,
  Text,
  BlockStack,
  InlineStack,
  Select,
  Button,
  Banner,
} from "@shopify/polaris";
import { ExternalIcon } from "@shopify/polaris-icons";
import { useState } from "react";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
      query getThemes {
        themes(first: 10, roles: [MAIN, UNPUBLISHED]) {
          edges {
            node {
              id
              name
              role
            }
          }
        }
      }`
  );

  const responseJson = await response.json();
  
  const themes = responseJson.data.themes.edges.map(({ node }: any) => ({
    label: node.name + (node.role === "MAIN" ? " (Live)" : ""),
    value: node.id.replace("gid://shopify/Theme/", ""),
    role: node.role,
  }));

  // Sort so main theme is first
  themes.sort((a: any, b: any) => {
    if (a.role === "MAIN") return -1;
    if (b.role === "MAIN") return 1;
    return 0;
  });

  return json({
    themes,
    apiKey: process.env.SHOPIFY_API_KEY,
    shop: session.shop,
  });
};

export default function Installation() {
  const { themes, apiKey, shop } = useLoaderData<typeof loader>();
  const [selectedTheme, setSelectedTheme] = useState(themes[0]?.value || "");

  const handleThemeChange = (value: string) => setSelectedTheme(value);

  const deepLink = `https://${shop}/admin/themes/${selectedTheme}/editor?context=apps&template=product&activateAppId=${apiKey}/find-perfect-size`;

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Box paddingBlockEnd="200">
              <Text variant="headingXl" as="h1">
                Installation
              </Text>
            </Box>

            <Card>
              <BlockStack gap="500">
                <Text variant="headingMd" as="h2">
                  Onboarding for app embed blocks
                </Text>
                <Text as="p">
                  Because app embed blocks are supported in all Shopify themes,
                  you can provide a single set of instructions to merchants who
                  are onboarding to your app.
                </Text>

                <Banner title="App embed blocks support deep linking">
                  <p>
                    This allows you to easily preview and start using our blocks
                    in your theme.
                  </p>
                </Banner>

                <BlockStack gap="200">
                  <Text variant="headingSm" as="h3">
                    Steps to install:
                  </Text>
                  <List type="number">
                    <List.Item>
                      Select the theme where you want to add the Bould Size
                      Finder.
                    </List.Item>
                    <List.Item>
                      Click the <strong>Preview in theme</strong> button below.
                    </List.Item>
                    <List.Item>
                      This will open the theme editor with the <strong>Bould Size Finder</strong> block activated.
                    </List.Item>
                    <List.Item>
                      Ensure the toggle is set to <strong>on</strong> (blue) in the App embeds section on the left.
                    </List.Item>
                    <List.Item>
                      Click <strong>Save</strong> in the top right corner of the theme editor.
                    </List.Item>
                  </List>
                </BlockStack>

                <Box
                  padding="400"
                  background="bg-surface-secondary"
                  borderRadius="200"
                >
                  <BlockStack gap="400">
                    <Text variant="headingSm" as="h3">
                      Select a theme to add the size finder
                    </Text>
                    <Select
                      label="Theme"
                      options={themes}
                      onChange={handleThemeChange}
                      value={selectedTheme}
                    />
                    <Text as="p" tone="subdued">
                      When activated, the size finder will appear on your product pages.
                    </Text>
                    <InlineStack>
                        <Button
                        variant="primary"
                        url={deepLink}
                        target="_blank"
                        icon={ExternalIcon}
                        >
                        Preview in theme
                        </Button>
                    </InlineStack>
                  </BlockStack>
                </Box>
              </BlockStack>
            </Card>
            
            <Box paddingBlockStart="200">
                <InlineStack align="center">
                    <Text as="p" tone="subdued">
                        Need help? <Link url="mailto:support@bouldhq.com">Contact Support</Link>
                    </Text>
                </InlineStack>
            </Box>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
