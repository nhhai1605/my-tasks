import { Flex, Typography } from "antd";
import { styles } from "../utilities";
const About = () => {
    return (
        <Flex>
            <Typography>My Tasks @{import.meta.env.VITE_VERSION} by halng</Typography>
        </Flex>
    );
};

export default About;
