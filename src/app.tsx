import '@ant-design/v5-patch-for-react-19';
import { createRoot } from "react-dom/client";
import { ConfigProvider, Layout } from "antd";
import { useState } from "react";
import { MenuBar } from "./components";
import { styles } from "./utilities";
const { Content, Sider } = Layout;

const App = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [screen, setScreen] = useState<any>(null);
    return (
        <ConfigProvider>
            <Layout style={{ minHeight: "100vh" }}>
                <Sider
                    collapsible
                    collapsed={collapsed}
                    onCollapse={(value) => setCollapsed(value)}
                >
                    <MenuBar setScreen={setScreen} />
                </Sider>
                <Layout>
                    <Content style={styles.common.margin}>
                        {screen}
                    </Content>
                </Layout>
            </Layout>
        </ConfigProvider>
    );
};

const root = createRoot(document.body);
root.render(<App />);
