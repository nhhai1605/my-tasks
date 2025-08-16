import { Button, Flex } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { message, Upload } from "antd";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useState } from "react";
const { Dragger } = Upload;

const handleFileSummary = async (file: any) => {
    try {
        // Step 1: Read file as ArrayBuffer
        const data = await file.originFileObj.arrayBuffer();

        // Step 2: Parse Excel
        const workbook = XLSX.read(data, { type: "array" });

        // Example: get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        console.log("Parsed JSON:", jsonData);

        // Do your processing here...
        const processedData = jsonData.map((row: any) => ({
            ...row,
            Status: "Processed", // Example: add new column
        }));

        // Step 3: Convert JSON back to worksheet
        const newWorksheet = XLSX.utils.json_to_sheet(processedData);

        // Step 4: Create new workbook
        const newWorkbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(
            newWorkbook,
            newWorksheet,
            "ProcessedData",
        );

        // Step 5: Export to new Excel file
        const wbout = XLSX.write(newWorkbook, {
            bookType: "xlsx",
            type: "array",
        });
        saveAs(
            new Blob([wbout], { type: "application/octet-stream" }),
            file.originFileObj.name.replace(/\.(xlsx|xls)$/i, "-processed.$1"),
        );
    } catch (err) {
        console.error("Error processing file:", err);
    }
};

const SalesDetailSummary = () => {
    const [uploadedFile, setUploadedFile] = useState<any>(null);
    const props: UploadProps = {
        name: "file",
        multiple: false,
        accept: ".xlsx,.xls",
        beforeUpload: (file) => {
            const isExcel =
                file.type ===
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                file.type === "application/vnd.ms-excel";

            if (!isExcel) {
                message.error(`${file.name} is not an Excel file`);
                return Upload.LIST_IGNORE;
            }
            setUploadedFile({ originFileObj: file });
            return false;
        },

        onDrop(e) {
            console.log("Dropped files", e.dataTransfer.files);
        },
        listType: "picture",
        pastable: true,
    };
    const onSubmit = () => {
        console.log("Submitting file:", uploadedFile);
        if (uploadedFile) {
            handleFileSummary(uploadedFile);
        }
    };

    return (
        <Flex
            gap="middle"
            vertical
            style={{
                width: "400px",
            }}
        >
            <Dragger {...props} maxCount={1}>
                <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                    Click or drag file to this area to upload
                </p>
                <p className="ant-upload-hint">
                    Support for a single or bulk upload. Strictly prohibited
                    from uploading company data or other banned files.
                </p>
            </Dragger>
            <Button type="primary" onClick={onSubmit}>
                Submit
            </Button>
        </Flex>
    );
};

export default SalesDetailSummary;
