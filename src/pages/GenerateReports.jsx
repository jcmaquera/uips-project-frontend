import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import {
  TextField,
  Button,
  Grid,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import * as XLSX from "xlsx-js-style"; // Importing XLSX library

const GenerateReports = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [inventoryData, setInventoryData] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [openDateDialog, setOpenDateDialog] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isDeliveryReport, setIsDeliveryReport] = useState(true); // Flag for report type
  const [columns, setColumns] = useState([
    { field: "deliveryDate", headerName: "Date", flex: 1, minWidth: 140 },
    { field: "itemType", headerName: "Item Type", flex: 1, minWidth: 120 },
    {
      field: "itemDescription",
      headerName: "Item Description",
      flex: 1.5,
      minWidth: 160,
    },
    {
      field: "sizeOrSource",
      headerName: "Size/Source",
      flex: 1,
      minWidth: 120,
    },
    { field: "quantity", headerName: "Quantity", flex: 1, minWidth: 100 },
    {
      field: "serialNumber",
      headerName: "Serial Number",
      flex: 1,
      minWidth: 130,
    },
  ]);

  const navigate = useNavigate();

  // Get User Info
  const getUserInfo = async () => {
    try {
      const response = await axiosInstance.get("/get-user");
      if (response.data && response.data.user) {
        setUserInfo(response.data.user);
      }
    } catch (error) {
      if (error.response.status === 401) {
        localStorage.clear();
        navigate("/login");
      }
    }
  };

  // Fetch Inventory Data
  const fetchInventoryData = async () => {
    try {
      const response = await axiosInstance.get("/get-inventory");
      const mappedData = response.data.map((inventory) => ({
        id: inventory._id,
        itemType: inventory.item.itemType,
        itemDescription: inventory.item.itemDesc,
        sizeOrSource: inventory.item.sizeSource,
        quantity: inventory.quantity,
        serialNumber: inventory.item.serialNo,
      }));
      setInventoryData(mappedData);
    } catch (error) {
      console.error("Error fetching inventory data:", error);
    }
  };

  // Generate Report (Based on Delivery or Checkout Number)
  const generateReport = async () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates.");
      return;
    }

    try {
      const url = isDeliveryReport
        ? "/generate-report-with-delivery-number"
        : "/generate-report-with-invoice-number";

      const response = await axiosInstance.post(url, {
        startDate,
        endDate,
      });

      if (
        response.data &&
        response.data[isDeliveryReport ? "deliveries" : "checkouts"]
      ) {
        const mappedReportData = response.data[
          isDeliveryReport ? "deliveries" : "checkouts"
        ].flatMap((item) =>
          item.items.map((reportItem) => ({
            id: `${item._id}-${reportItem.item.serialNo}`, // Unique ID combining delivery or checkout and serial number
            [isDeliveryReport ? "deliveryNumber" : "checkoutNumber"]:
              item[isDeliveryReport ? "deliveryNumber" : "checkoutNumber"],
            // Format the date to only include the date part (no time)
            deliveryDate: new Date(
              item.checkoutDate || item.deliveryDate
            ).toLocaleDateString("en-GB"),
            itemType: reportItem.item.itemType,
            itemDescription: reportItem.item.itemDesc,
            sizeOrSource: reportItem.item.sizeSource,
            quantity: reportItem.quantity,
            serialNumber: reportItem.item.serialNo,
          }))
        );
        setReportData(mappedReportData);

        // Dynamically update columns after generating the report
        setColumns([
          {
            field: isDeliveryReport ? "deliveryNumber" : "checkoutNumber",
            headerName: isDeliveryReport
              ? "Delivery Number"
              : "Checkout Number",
            flex: 1,
            minWidth: 150,
          },
          {
            field: "deliveryDate",
            headerName: "Date",
            flex: 1,
            minWidth: 140,
          },
          {
            field: "itemType",
            headerName: "Item Type",
            flex: 1,
            minWidth: 120,
          },
          {
            field: "itemDescription",
            headerName: "Item Description",
            flex: 1.5,
            minWidth: 160,
          },
          {
            field: "sizeOrSource",
            headerName: "Size/Source",
            flex: 1,
            minWidth: 120,
          },
          { field: "quantity", headerName: "Quantity", flex: 1, minWidth: 100 },
          {
            field: "serialNumber",
            headerName: "Serial Number",
            flex: 1,
            minWidth: 130,
          },
        ]);

        setOpenDateDialog(false); // Close date picker dialog
      }
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report.");
    }
  };

  // Export to Excel function
  // Export to Excel function
  const exportToExcel = () => {
    // Define headers dynamically based on report type
    const headers = isDeliveryReport
      ? [
          [
            "Date",
            "Item Type",
            "Item Description",
            "Size/Source",
            "Quantity",
            "Serial Number",
            "Delivery Number",
          ],
        ]
      : [
          [
            "Date",
            "Item Type",
            "Item Description",
            "Size/Source",
            "Quantity",
            "Serial Number",
            "Checkout Number",
          ],
        ];

    // Helper function to format date as DD/MM/YYYY
    const formatDateBritish = (dateString) => {
      const date = new Date(dateString);
      if (isNaN(date)) return "Invalid Date";
      const day = String(date.getDate()).padStart(2, "0"); // Ensure 2-digit day
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Ensure 2-digit month (months are 0-based)
      const year = date.getFullYear();
      return `${day}/${month}/${year}`; // British format (DD/MM/YYYY)
    };

    // Format data based on report type
    const formattedData = reportData.map(
      ({
        deliveryDate,
        itemType,
        itemDescription,
        sizeOrSource,
        quantity,
        serialNumber,
        deliveryNumber,
        checkoutNumber,
      }) => {
        const formattedDate = formatDateBritish(deliveryDate); // Convert date before adding to Excel

        return isDeliveryReport
          ? [
              formattedDate, // Store as plain text
              itemType,
              itemDescription,
              sizeOrSource,
              quantity,
              serialNumber,
              deliveryNumber || "",
            ]
          : [
              formattedDate, // Store as plain text
              itemType,
              itemDescription,
              sizeOrSource,
              quantity,
              serialNumber,
              checkoutNumber || "",
            ];
      }
    );

    // Create worksheet & add data
    const worksheet = XLSX.utils.aoa_to_sheet([...headers, ...formattedData]);

    // Define header style
    const headerStyle = {
      font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } }, // White bold text
      fill: { fgColor: { rgb: "4F81BD" } }, // Matte blue background
      alignment: { horizontal: "center", vertical: "center" },
    };

    // Apply styles to headers
    headers[0].forEach((_, colIndex) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: colIndex });
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = headerStyle;
      }
    });

    // Set column widths dynamically
    worksheet["!cols"] = headers[0].map((header) => ({
      wch: header.length + 5,
    }));

    // **Ensure Excel treats the date as plain text to avoid auto-formatting issues**
    formattedData.forEach((row, rowIndex) => {
      const cellRef = XLSX.utils.encode_cell({ r: rowIndex + 1, c: 0 }); // Date column (first column)
      if (worksheet[cellRef]) {
        worksheet[cellRef].z = "@"; // Forces Excel to treat it as text
      }
    });

    // Create workbook & append styled worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Styled Report");

    // Export the Excel file
    XLSX.writeFile(workbook, "Styled_Report.xlsx");
  };

  useEffect(() => {
    getUserInfo();
    fetchInventoryData();
  }, []);

  return (
    <div>
      <Navbar userInfo={userInfo} />
      <Paper sx={{ padding: 2, marginTop: 2 }}>
        <Grid
          container
          spacing={2}
          direction="row"
          justifyContent="flex-start" // Align to the start for better use of space
          alignItems="center"
        >
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Button
              variant="contained"
              color="primary"
              style={{ marginRight: "10px", width: "100%" }}
              onClick={() => {
                setIsDeliveryReport(true); // Set to Delivery Report
                setOpenDateDialog(true); // Open date range dialog
              }}
            >
              Report by Delivery
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <Button
              variant="contained"
              color="secondary"
              style={{ width: "100%" }}
              onClick={() => {
                setIsDeliveryReport(false); // Set to Checkout Report
                setOpenDateDialog(true); // Open date range dialog
              }}
            >
              Report by Receipt
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Date Range Dialog */}
      <Dialog
        open={openDateDialog}
        onClose={() => setOpenDateDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Select Date Range</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                type="date"
                label="Start Date"
                fullWidth
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                type="date"
                label="End Date"
                fullWidth
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDateDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={generateReport} color="primary">
            Generate Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* DataGrid Table to Display Report */}
      <div
        style={{
          height: 400,
          width: "100%",
          marginTop: "20px",
          overflowX: "auto", // Enable horizontal scrolling
        }}
      >
        <DataGrid
          rows={reportData}
          columns={columns}
          pageSize={5}
          disableSelectionOnClick
          sx={{
            ".MuiDataGrid-columnHeader": {
              fontWeight: "bold",
              fontSize: "0.85rem", // Smaller font size for headers
            },
            width: "100%",
            // Adjusting the responsiveness
            "& .MuiDataGrid-cell": {
              fontSize: "0.85rem", // Smaller font size for table content
              padding: "6px 8px", // Smaller padding inside cells
            },
            "@media (max-width: 600px)": {
              "& .MuiDataGrid-columnHeader": {
                fontSize: "0.75rem", // Smaller font size on small screens
              },
              "& .MuiDataGrid-cell": {
                fontSize: "0.75rem", // Smaller font size on small screens
              },
            },
          }}
        />
      </div>

      {/* Export to Excel Button */}
      <Button
        variant="contained"
        color="success"
        style={{ marginTop: "20px", marginLeft: "10px" }}
        onClick={exportToExcel}
      >
        Export to Excel
      </Button>
    </div>
  );
};

export default GenerateReports;
