import User from '../models/userModel';
import Product from '../models/productModel';
import Order from '../models/orderModel';


export const getAnalyticsData = async () => {
    try{
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();
        const salesData = await Order.aggregate([
            {
                $group: {
                    _id: null, 
                    totalSales: { $sum: 1 },
                    totalRevenue: { $sum: "$totalAmount" },
                },
            },
        ]);

        const { totalSales, totalRevenue } = salesData[0] || { totalSales: 0, totalRevenue: 0 };

        return {
            users: totalUsers,
            products: totalProducts,
            totalSales,
            totalRevenue,
        };
    }catch(error){
        console.error('Analytics error:', error);
        return {
            error: error instanceof Error ? error.message : 'Failed to fetch analytics data',
        };
    }
}

export const getDailySalesData = async (startDate:Date, endDate:Date) => {
	try {
		const dailySalesData = await Order.aggregate([
			{
				$match: {
					createdAt: {
						$gte: startDate,
						$lte: endDate,
					},
				},
			},
			{
				$group: {
					_id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
					sales: { $sum: 1 },
					revenue: { $sum: "$totalAmount" },
				},
			},
			{ $sort: { _id: 1 } },
		]);


		const dateArray = getDatesInRange(startDate, endDate);

		return dateArray.map((date) => {
			const foundData = dailySalesData.find((item) => item._id === date);

			return {
				date,
				sales: foundData?.sales || 0,
				revenue: foundData?.revenue || 0,
			};
		});
	} catch (error) {
		throw error;
	}
};

function getDatesInRange(startDate:Date, endDate:Date) {
	const dates = [];
	let currentDate = new Date(startDate);

	while (currentDate <= endDate) {
		dates.push(currentDate.toISOString().split("T")[0]);
		currentDate.setDate(currentDate.getDate() + 1);
	}

	return dates;
}