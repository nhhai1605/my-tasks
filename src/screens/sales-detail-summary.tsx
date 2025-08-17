import { Button, Flex, Table, Tabs } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { message, Upload } from "antd";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useState } from "react";
const { Dragger } = Upload;

const SalesDetailSummary = () => {
    const [uploadedFile, setUploadedFile] = useState<any>(null);
    const [tables, setTables] = useState<
        Record<string, { columns: any[]; data: any[] }>
    >({});
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
    const handleFileSummary = async (file: any, isExport: boolean) => {
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
                    info[sheetNames[0]] && info[sheetNames[1]]
                        ? Math.round(
                              info[sheetNames[0]] * info[sheetNames[1]] * 100,
                          ) / 100
                        : null;

                masterData[itemId].customerInfo[customer] = info;
            }

            const allCustomers = Array.from(customerSet).sort();

            // --- Build tables for each sheet ---
            const newTables: Record<string, { columns: any[]; data: any[] }> =
                {};

            // --- Step 2: Transform into worksheets ---
            const buildSheet = (type: string) => {
                const header = ["Mã hàng", "Tên hàng", "ĐVT", ...allCustomers];

                // rows for Excel
                const rows = Object.entries(masterData).map(
                    ([itemId, data]) => [
                        itemId,
                        data.itemName,
                        data.unit,
                        ...allCustomers.map(
                            (c) => data.customerInfo[c]?.[type] ?? null,
                        ),
                    ],
                );

                // rows for Antd Table (object format)
                const tableData = Object.entries(masterData).map(
                    ([itemId, data]) => {
                        const row: any = {
                            key: itemId,
                            "Mã hàng": itemId,
                            "Tên hàng": data.itemName,
                            ĐVT: data.unit,
                        };
                        allCustomers.forEach((c) => {
                            row[c] = data.customerInfo[c]?.[type] ?? null;
                        });
                        return row;
                    },
                );
                var sheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
                // Apply Vietnamese money format (with thousand separator and ₫)
                if (type != sheetNames[0]) {
                    // is money type
                    Object.keys(sheet).forEach((cell) => {
                        if (cell[0] === "!") return; // skip special keys
                        if (
                            sheet[cell].t === "n" &&
                            !["A", "B", "C"].includes(cell)
                        ) {
                            // Example: if your money is in column C
                            sheet[cell].z = "#,##0.00";
                        }
                    });
                }

                return {
                    sheet: sheet, // for Excel
                    table: {
                        columns: header.map((h) => ({
                            title: h,
                            dataIndex: h,
                            key: h,
                        })),
                        data: tableData, // for Antd Table
                    },
                };
            };

            const newWorkbook = XLSX.utils.book_new();
            sheetNames.forEach((name) => {
                const { sheet, table } = buildSheet(name);
                newTables[name] = table;
                XLSX.utils.book_append_sheet(newWorkbook, sheet, name);
            });
            if (isExport) {
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
            } else {
                setTables(newTables);
            }
        } catch (err) {
            console.error("Error processing file:", err);
        }
    };

    const onExport = () => {
        if (uploadedFile) {
            handleFileSummary(uploadedFile, true);
        }
    };

    const onSummary = () => {
        if (uploadedFile) {
            handleFileSummary(uploadedFile, false);
        }
    };

    const getColumnWidth = (idx: number) => {
        return idx == 0 ? 150 : idx == 1 ? 200 : idx == 2 ? 50 : 100;
    };

    return (
        <Flex gap="middle" vertical>
            <Flex gap="middle" vertical style={{ width: "400px" }}>
                <Dragger {...props} maxCount={1}>
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">
                        Click or drag file to this area to upload
                    </p>
                    <p className="ant-upload-hint">
                        Support for a single file upload. Only accept Excel
                        files.
                    </p>
                </Dragger>
                <Flex gap="middle">
                    <Button
                        type="primary"
                        disabled={!uploadedFile}
                        onClick={onSummary}
                        style={{ flex: 1 }}
                    >
                        Summary
                    </Button>
                    <Button
                        type="primary"
                        disabled={!uploadedFile}
                        onClick={onExport}
                        style={{ flex: 1 }}
                    >
                        Export
                    </Button>
                </Flex>
            </Flex>
            {Object.keys(tables).length > 0 && (
                <Tabs
                    style={{ flex: 1 }}
                    defaultActiveKey="0"
                    items={Object.entries(tables).map(([sheet, t], keyIdx) => ({
                        key: String(keyIdx),
                        label: sheet,
                        children: (
                            <Table
                                dataSource={t.data}
                                columns={t.columns.map((col, idx) => {
                                    if (idx >= 3 && keyIdx !== 0) {
                                        return {
                                            ...col,
                                            width: 200,
                                            render: (value: number) =>
                                                new Intl.NumberFormat(
                                                    "vi-VN",
                                                ).format(value),
                                        };
                                    }

                                    return {
                                        ...col,
                                        width: getColumnWidth(idx),
                                    };
                                })}
                                bordered
                                pagination={{
                                    pageSize: 20,
                                    showSizeChanger: true,
                                    pageSizeOptions: [20, 50, 100],
                                }}
                                scroll={{ x: "max-content" }} // important to enable horizontal scroll
                            />
                        ),
                    }))}
                />
            )}
        </Flex>
    );
};

export default SalesDetailSummary;
