
import { useState, useCallback } from "react";
import {
  DropZone,
  LegacyStack,
  Thumbnail,
  LegacyCard,
  Text,
  Box,
} from "@shopify/polaris";
import { NoteIcon } from "@shopify/polaris-icons";

const DropZoneUploader = () => {
  const [files, setFiles] = useState<File[]>([]);

  const handleDrop = useCallback((dropFiles: File[]) => {
    setFiles((prev) => [...prev, ...dropFiles]);
  }, []);

  const validImageTypes = ["image/gif", "image/jpeg", "image/png"];

  const fileUpload = !files.length && <DropZone.FileUpload />;
  const uploadedFiles = files.length > 0 && (
    <Box padding="200">
      <LegacyStack vertical>
        {files.map((file, index) => (
          <LegacyStack alignment="center" key={index}>
            <Thumbnail
              size="small"
              alt={file.name}
              source={
                validImageTypes.includes(file.type)
                  ? window.URL.createObjectURL(file)
                  : NoteIcon
              }
            />
            <div>
              {file.name}{" "}
              <Text variant="bodySm" as="p">
                {file.size} bytes
              </Text>
            </div>
          </LegacyStack>
        ))}
      </LegacyStack>
    </Box>
  );

  return (
    <LegacyCard>
      <LegacyCard.Section>
        <DropZone onDrop={handleDrop} outline>
          {fileUpload}
        </DropZone>
        {uploadedFiles}
      </LegacyCard.Section>
      <Box  />
    </LegacyCard>
  );
};

export default DropZoneUploader;
