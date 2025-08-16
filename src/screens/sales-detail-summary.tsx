import { Flex } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { message, Upload } from "antd";

const { Dragger } = Upload;

const props: UploadProps = {
    name: "file",
    multiple: false,
    beforeUpload: (file) => {
        const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        if (!isExcel) {
            message.error(`${file.name} is not an excel file`);
        }
        return isExcel || Upload.LIST_IGNORE;
    },
    onChange(info) {
        const { status } = info.file;
        if (status !== "uploading") {
            console.log(info.file, info.fileList);
        }
        if (status === "done") {
            message.success(`${info.file.name} file uploaded successfully.`);
        } else if (status === "error") {
            message.error(`${info.file.name} file upload failed.`);
        }
    },
    onDrop(e) {
        console.log("Dropped files", e.dataTransfer.files);
    },
};

const SalesDetailSummary = () => {
    return (
        <Flex gap="middle" vertical>
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
        </Flex>
    );
};

export default SalesDetailSummary;
