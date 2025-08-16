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
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);
        console.log("Parsed JSON:", jsonData);

        let startAtRow = 2;
        var customerIdx = 7;
        var itemIdIdx = 9;
        var itemNameIdx = 10;
        var unitIdx = 11;
        var quantityIdx = 12;
        var priceIdx = 13;
        var totalIdx = 14;
        let masterData: any = {};
        let allUniqueCustomers: any = new Set();
        const dataSheetName = ["Tổng số lượng bán", "Đơn giá", "Doanh thu"];

        for (let i = startAtRow; i < jsonData.length; i++) {
            const row = jsonData[i];
            const columns = Object.keys(row);
            const itemId = row[columns[itemIdIdx]];
            if (!itemId) {
                continue; // Skip rows without itemId
            }
            if (!masterData[itemId]) {
                masterData[itemId] = {
                    itemName: row[columns[itemNameIdx]],
                    unit: row[columns[unitIdx]],
                    customerInfo: {},
                };
            }
            // if exist customerInfo[row[columns[customerIdx]]] then plus the quantity and total
            let curCustomer = masterData[itemId].customerInfo[row[columns[customerIdx]]];
            if (curCustomer) {
                if(row[columns[customerIdx]]== "C10015" && itemId == "HK - 0000006 - 01")
                {
                    console.log("Found C10015:", row[columns[customerIdx]], curCustomer);
                    console.log("Found C10015 2:", row[columns[priceIdx]]);
                }
                curCustomer[dataSheetName[0]] += row[columns[quantityIdx]];
                curCustomer[dataSheetName[1]] = row[columns[priceIdx]] > 0 ? row[columns[priceIdx]] : curCustomer[dataSheetName[1]];
                curCustomer[dataSheetName[2]] = curCustomer[dataSheetName[0]] * curCustomer[dataSheetName[1]];
            } else {
                masterData[itemId].customerInfo[row[columns[customerIdx]]] = {
                    [dataSheetName[0]]: row[columns[quantityIdx]],
                    [dataSheetName[1]]: row[columns[priceIdx]],
                    [dataSheetName[2]]: row[columns[totalIdx]],
                };
            }

            allUniqueCustomers.add(row[columns[customerIdx]]);
        }
        allUniqueCustomers = Array.from(allUniqueCustomers).sort();
        console.log("Master Data:", masterData);
        // Now make 3 worksheets for quantity, price, and total, each worksheets will have same itemId, itemName, Unit for first 3 columns
        // Then will have unique customer data in subsequent columns , and each column will have data for quantity, price, total for that correspond sheet
        let itemList: any[] = [];
        for (const itemId in masterData) {
            itemList.push({
                itemId: itemId,
                itemName: masterData[itemId].itemName,
                unit: masterData[itemId].unit,
            });
        }
        let worksheetList: any = {};

        for (const dataType of dataSheetName) {
            let rows: any[] = [];
            for (const item of itemList) {
                let row: any[] = [];
                for (const key of Object.keys(item)) {
                    row.push(item[key]);
                }
                for (const customer of allUniqueCustomers) {
                    row.push(
                        masterData[item.itemId].customerInfo[customer]?.[dataType] || null,
                    );
                }
                rows.push(row);
            }
            worksheetList[dataType] = XLSX.utils.aoa_to_sheet([
                [
                    "Mã hàng",
                    "Tên hàng",
                    "ĐVT",
                    ...allUniqueCustomers.map((customer: any) => customer),
                ],
                ...rows,
            ]);
        }

        const newWorkbook = XLSX.utils.book_new();
        for (const dataType of dataSheetName) {
            XLSX.utils.book_append_sheet(
                newWorkbook,
                worksheetList[dataType],
                dataType,
            );
        }

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
