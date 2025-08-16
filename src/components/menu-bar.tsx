import { Menu } from "antd";
import { CalculatorOutlined ,InfoCircleOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { About, SalesDetailSummary } from "../screens";

const items: any[] = [
    {
        label: "Sales Detail Summary",
        key: "sales-detail-summary",
        icon: <CalculatorOutlined />,
        screen: <SalesDetailSummary />
    },
    {
        label: "About",
        key: "about",
        icon: <InfoCircleOutlined />,
        screen: <About />
    }
];

const defaultKey = items[0].key;
interface HeaderProps {
    setScreen: (screen: any) => void;
}

const MenuBar = ({setScreen} : HeaderProps) => {
    const [screenName, setScreenName] = useState<string>(defaultKey);
    const onClick: any = (e: any) => {
        setScreenName(e.key);
    };

    useEffect(() => {
        const selectedItem = items.find(item => item.key === screenName);
        if (selectedItem) {
            setScreen(selectedItem.screen);
        }
    }, [screenName]);

    return (
        <Menu
            onClick={onClick}
            selectedKeys={[screenName]}
            mode="inline"
            theme="dark"
            items={items}
        />
    );
};

export default MenuBar;
