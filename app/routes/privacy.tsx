import {
    Page,
    Layout,
    Card,
    BlockStack,
    Text,
    Link,
    Box,
    AppProvider,
} from "@shopify/polaris";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import en from "@shopify/polaris/locales/en.json";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export default function PrivacyPolicy() {
    return (
        <AppProvider i18n={en}>
            <Page title="Privacy Policy">
                <Layout>
                    <Layout.Section>
                        <Card>
                            <Box padding="400">
                                <BlockStack gap="400">
                                    <Text as="p" variant="bodyMd">
                                        Last updated: {new Date().toLocaleDateString()}
                                    </Text>

                                    <Text variant="headingMd" as="h2">
                                        1. Introduction
                                    </Text>
                                    <Text as="p" variant="bodyMd">
                                        Bould ("we", "us", or "our") respects your privacy and is
                                        committed to protecting the personal information of our
                                        merchants and their customers. This Privacy Policy describes
                                        how we collect, use, and share information when you install
                                        or use the Bould app in connection with your Shopify store.
                                    </Text>

                                    <Text variant="headingMd" as="h2">
                                        2. Information We Collect
                                    </Text>
                                    <Text as="p" variant="bodyMd">
                                        When you install Bould, we are automatically able to access
                                        certain types of information from your Shopify account:
                                    </Text>
                                    <ul style={{ paddingLeft: "20px", margin: "10px 0" }}>
                                        <li>
                                            <Text as="span" variant="bodyMd">
                                                <strong>Shop Information:</strong> Shop domain, email,
                                                country, and plan details.
                                            </Text>
                                        </li>
                                        <li>
                                            <Text as="span" variant="bodyMd">
                                                <strong>Product Data:</strong> Product titles, images,
                                                and descriptions (to generate renders and size
                                                recommendations).
                                            </Text>
                                        </li>
                                        <li>
                                            <Text as="span" variant="bodyMd">
                                                <strong>Customer Data:</strong> When a customer uses the
                                                Bould widget, we may process their uploaded images and
                                                height information to provide size recommendations. This
                                                data is processed transiently and is not permanently
                                                stored linked to a specific identity unless required for
                                                the service.
                                            </Text>
                                        </li>
                                    </ul>

                                    <Text variant="headingMd" as="h2">
                                        3. How We Use Your Information
                                    </Text>
                                    <Text as="p" variant="bodyMd">
                                        We use the personal information we collect from you and your
                                        customers in order to provide the Service and to operate the
                                        App. Additionally, we use this information to:
                                    </Text>
                                    <ul style={{ paddingLeft: "20px", margin: "10px 0" }}>
                                        <li>
                                            <Text as="span" variant="bodyMd">
                                                Provide size recommendations and visualization
                                                services.
                                            </Text>
                                        </li>
                                        <li>
                                            <Text as="span" variant="bodyMd">
                                                Communicate with you about the App.
                                            </Text>
                                        </li>
                                        <li>
                                            <Text as="span" variant="bodyMd">
                                                Improve and optimize our App (e.g., by analyzing usage
                                                trends).
                                            </Text>
                                        </li>
                                    </ul>

                                    <Text variant="headingMd" as="h2">
                                        4. Sharing Your Information
                                    </Text>
                                    <Text as="p" variant="bodyMd">
                                        We do not sell your personal information. We may share your
                                        Personal Information to comply with applicable laws and
                                        regulations, to respond to a subpoena, search warrant or
                                        other lawful request for information we receive, or to
                                        otherwise protect our rights.
                                    </Text>

                                    <Text variant="headingMd" as="h2">
                                        5. Data Retention
                                    </Text>
                                    <Text as="p" variant="bodyMd">
                                        We retain your personal information only for as long as
                                        necessary to provide you with our services and as described
                                        in this Privacy Policy. However, we may also be required to
                                        retain this information to comply with our legal and
                                        regulatory obligations, to resolve disputes, and to enforce
                                        our agreements.
                                    </Text>

                                    <Text variant="headingMd" as="h2">
                                        6. Your Rights
                                    </Text>
                                    <Text as="p" variant="bodyMd">
                                        If you are a European resident, you have the right to access
                                        personal information we hold about you and to ask that your
                                        personal information be corrected, updated, or deleted. If
                                        you would like to exercise this right, please contact us
                                        through the contact information below.
                                    </Text>

                                    <Text variant="headingMd" as="h2">
                                        7. Contact Us
                                    </Text>
                                    <Text as="p" variant="bodyMd">
                                        For more information about our privacy practices, if you
                                        have questions, or if you would like to make a complaint,
                                        please contact us by e-mail at{" "}
                                        <Link url="mailto:support@bouldhq.com">support@bouldhq.com</Link>.
                                    </Text>
                                </BlockStack>
                            </Box>
                        </Card>
                    </Layout.Section>
                </Layout>
            </Page>
        </AppProvider>
    );
}
