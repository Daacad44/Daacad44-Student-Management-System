import env from "@/config/env";
import logger from "@/config/logger";
import app from "./app";

const PORT = env.PORT;

app.listen(PORT, () => {
  logger.info(`SMS API running on port ${PORT}`);
});
