import express from "express";
import { adminRoute, authMiddleware } from "../middleware/authMiddleware.js";
import { getAnalyticsData, getDailySalesData } from "../controller/analyticsController.js";

const router = express.Router();

router.get("/", authMiddleware, adminRoute, async (req, res) => {
	try {
		const analyticsData = await getAnalyticsData();

		const endDate = new Date();
		const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

		const dailySalesData = await getDailySalesData(startDate, endDate);

		res.json({
			analyticsData,
			dailySalesData,
		});
	} catch (error) {
		const err = error as Error;
		console.log("Error in analytics route", err.message);
		res.status(500).json({ message: "Server error", error: err.message });
	}
});

export default router;