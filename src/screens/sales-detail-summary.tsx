import { Button, Flex } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { message, Upload } from "antd";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useState } from "react";
const { Dragger } = Upload;

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
        listType: "picture",
        pastable: true,
    };

    // --- File summary handler ---
    const handleFileSummary = async (file: any) => {
        try {
            const data = await file.originFileObj.arrayBuffer();
            const workbook = XLSX.read(data, { type: "array" });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

            // Index mapping (make it a config object)
            const colIdx = {
                customer: 7,
                itemId: 9,
                itemName: 10,
                unit: 11,
                quantity: 12,
                price: 13,
                total: 14,
            };

            const sheetNames = ["Tổng số lượng bán", "Đơn giá", "Doanh thu"];
            const masterData: Record<string, any> = {};
            const customerSet = new Set<string>();

            // --- Helper: Get cell value by index ---
            const cell = (row: any, idx: number) => row[Object.keys(row)[idx]];

            // --- Step 1: Build master data ---
            for (let i = 2; i < jsonData.length; i++) {
                const row = jsonData[i];
                const itemId = cell(row, colIdx.itemId);
                if (!itemId) continue;

                if (!masterData[itemId]) {
                    masterData[itemId] = {
                        itemName: cell(row, colIdx.itemName),
                        unit: cell(row, colIdx.unit),
                        customerInfo: {},
                    };
                }

                const customer = cell(row, colIdx.customer);
                customerSet.add(customer);

                const info = masterData[itemId].customerInfo[customer] ?? {
                    [sheetNames[0]]: null,
                    [sheetNames[1]]: null,
                    [sheetNames[2]]: null,
                };

                const qty = cell(row, colIdx.quantity) || null;
                const price = cell(row, colIdx.price) || null;

                info[sheetNames[0]] += qty || null;
                info[sheetNames[1]] =
                    (price > 0 ? price : info[sheetNames[1]]) || null;
                info[sheetNames[2]] =
                    info[sheetNames[0]] * info[sheetNames[1]] || null;

                masterData[itemId].customerInfo[customer] = info;
            }

            const allCustomers = Array.from(customerSet).sort();

            // --- Step 2: Transform into worksheets ---
            const buildSheet = (type: string) => {
                const header = ["Mã hàng", "Tên hàng", "ĐVT", ...allCustomers];
                const rows = Object.entries(masterData).map(
                    ([itemId, data]) => {
                        return [
                            itemId,
                            data.itemName,
                            data.unit,
                            ...allCustomers.map(
                                (c) => data.customerInfo[c]?.[type] ?? null,
                            ),
                        ];
                    },
                );
                return XLSX.utils.aoa_to_sheet([header, ...rows]);
            };

            const newWorkbook = XLSX.utils.book_new();
            sheetNames.forEach((name) => {
                XLSX.utils.book_append_sheet(
                    newWorkbook,
                    buildSheet(name),
                    name,
                );
            });

            // --- Step 3: Save ---
            const wbout = XLSX.write(newWorkbook, {
                bookType: "xlsx",
                type: "array",
            });
            saveAs(
                new Blob([wbout], { type: "application/octet-stream" }),
                file.originFileObj.name.replace(
                    /\.(xlsx|xls)$/i,
                    "-processed.$1",
                ),
            );
        } catch (err) {
            console.error("Error processing file:", err);
        }
    };

    // --- Submit handler ---
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
        >
            <Dragger {...props} maxCount={1}>
                <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                    Click or drag file to this area to upload
                </p>
                <p className="ant-upload-hint">
                    Support for a single file upload. Only accept Excel files.
                </p>
            </Dragger>
            <Button type="primary" onClick={onSubmit}>
                Submit
            </Button>
        </Flex>
    );
};

export default SalesDetailSummary;
