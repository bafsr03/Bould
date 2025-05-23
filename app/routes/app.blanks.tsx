import React, { useState, useCallback } from "react";
import {
  Page,
  Layout,
  Banner,
  Grid,
  Text,
  Box,
  Link,
} from "@shopify/polaris";
import MediaSection from "./blanksComponents/MediaSection";
import SalesCard from "./blanksComponents/OrderCard";
import TechnicalPackages from "./blanksComponents/TechnicalPackage";

import type { CategoryDetails } from './blanksComponents/categoryData';
import { categoriesData } from './blanksComponents/categoryData'; // Adjust path if needed

// --- TEMPORARY SETTING: Define which category should be the ONLY one enabled ---
// Change this value to "Pants", "Hoodies", etc., to test other categories.
// If this category doesn't exist in your `categoryData.ts`, all options might appear disabled.
const TEMPORARILY_ENABLED_CATEGORY = "Shirts";
// --- END TEMPORARY SETTING ---

const categoryNames = Object.keys(categoriesData);

// Set the initial category to the one we want to be enabled, with fallbacks.
let initialCategory: string;
if (categoriesData[TEMPORARILY_ENABLED_CATEGORY]) {
  initialCategory = TEMPORARILY_ENABLED_CATEGORY;
} else if (categoryNames.length > 0) {
  initialCategory = categoryNames[0];
  console.warn(
    `TEMPORARILY_ENABLED_CATEGORY "${TEMPORARILY_ENABLED_CATEGORY}" not found. Defaulting to "${initialCategory}".`
  );
} else {
  initialCategory = "Shirts"; // Fallback if categoriesData is empty
  console.warn(
    `categoriesData is empty or TEMPORARILY_ENABLED_CATEGORY is not found. Defaulting to "${initialCategory}".`
  );
}


export default function BlanksPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);

  const handleCategoryChange = useCallback(
    (newCategory: string) => {
      // Only allow the change if the new category is the one we've designated as enabled
      // and it exists in our data.
      if (newCategory === TEMPORARILY_ENABLED_CATEGORY && categoriesData[newCategory]) {
        setSelectedCategory(newCategory);
      } else if (categoriesData[newCategory]) {
        // This part might not be reached if UI elements are correctly disabled,
        // but it's a good safeguard or for alternative scenarios.
        console.log(`Switching to category "${newCategory}" is currently disabled by TEMPORARILY_ENABLED_CATEGORY setting.`);
      }
    },
    [], // TEMPORARILY_ENABLED_CATEGORY is a constant defined outside, so not needed in deps
  );

  // Gracefully handle if selectedCategory somehow doesn't exist in categoriesData
  // (e.g., if initialCategory fallback logic leads to an invalid state, though unlikely with current setup)
  const currentCategoryDetails: CategoryDetails = categoriesData[selectedCategory] || 
                                                 categoriesData[categoryNames[0]] || 
                                                 { title: "Error: No Category Data", subtitle: "Please check configuration.", images: [], titleMetadata: undefined };


  const stretchStyles = `
    .equal-height-card-wrapper > .Polaris-LegacyCard {
      height: 100%;
    }
  `;

  return (
    <>
      {/* — Blanks header only — */}
      <Page titleHidden>
        <Text variant="headingXl" as="h1">
          Blanks
        </Text>
        <Layout>
          <Layout.Section>
            <Banner title="Experimental mode" onDismiss={() => { /* Implement dismiss logic if needed */ }}>
              <p>
                Blanks is still in Beta testing; you can still view our extended
                catalog below.
              </p>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>

      <style>{stretchStyles}</style>

      <Page
        title={currentCategoryDetails.title}
        titleMetadata={currentCategoryDetails.titleMetadata}
        subtitle={currentCategoryDetails.subtitle}
        compactTitle
        pagination={{ hasPrevious: true, hasNext: true }}
        primaryAction={{
          content: "View on converter",
          disabled: true,
        }}
        actionGroups={[
          {
            title: `Category: ${selectedCategory}`,
            actions: categoryNames.map(catName => ({
              content: catName,
              onAction: () => handleCategoryChange(catName),
              // Disable the action if it's not the TEMPORARILY_ENABLED_CATEGORY
              disabled: catName !== TEMPORARILY_ENABLED_CATEGORY,
            })),
          },
        ]}
      >
        <Layout>
          <Layout.Section>
            <MediaSection images={currentCategoryDetails.images} />
          </Layout.Section>

          <Layout.Section>
            <Grid>
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                <div style={{ height: '100%' }} className="equal-height-card-wrapper">
                  <TechnicalPackages />
                </div>
              </Grid.Cell>
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                <div style={{ height: '100%' }} className="equal-height-card-wrapper">
                  <SalesCard />
                </div>
              </Grid.Cell>
            </Grid>
          </Layout.Section>
        </Layout>
        <Box padding="1000">
          <div style={{ textAlign: "center" }}>
            <Text as="h4" tone="subdued">
              Need help?{" "}
              <Link url="mailto:jake@bouldhq.com" removeUnderline>
                Chat with us.
              </Link>
            </Text>
            <Box paddingBlockStart="100">
              <Text as="h4" tone="subdued">
                © 2025 Bould
              </Text>
            </Box>
          </div>
        </Box>
      </Page>
    </>
  );
}