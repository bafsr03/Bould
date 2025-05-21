// src/components/DropZoneUploader.tsx
import React, { useState, useCallback } from "react";
import { LegacyCard, DropZone, LegacyStack, Thumbnail, Text } from "@shopify/polaris";
import { NoteIcon } from "@shopify/polaris-icons";

const DropZoneUploader = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [openFileDialog, setOpenFileDialog] = useState(false);

  const handleDropZoneDrop = useCallback(
    (dropFiles: File[]) => setFiles((prev) => [...prev, ...dropFiles]),
    []
  );

  const toggleOpenFileDialog = useCallback(
    () => setOpenFileDialog((prev) => !prev),
    []
  );

  const validImageTypes = ["image/gif", "image/jpeg", "image/png"];

  const uploadedFiles = files.length > 0 && (
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
            {file.name}
            <Text variant="bodySm" as="p">
              {file.size} bytes
            </Text>
          </div>
        </LegacyStack>
      ))}
    </LegacyStack>
  );

  return (
    <LegacyCard
      sectioned
      title="Product Images"
      actions={[{ content: "Upload Image", onAction: toggleOpenFileDialog }]}
    >
      <DropZone
        openFileDialog={openFileDialog}
        onDrop={handleDropZoneDrop}
        onFileDialogClose={toggleOpenFileDialog}
      >
        {uploadedFiles}
      </DropZone>
    </LegacyCard>
  );
};

export default DropZoneUploader;
