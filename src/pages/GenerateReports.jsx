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
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { enGB } from "date-fns/locale"; // Import locale (can change based on user locale)
import * as XLSX from "xlsx-js-style"; // Importing XLSX library

const GenerateReports = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [inventoryData, setInventoryData] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [openDateDialog, setOpenDateDialog] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
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
        startDate: startDate.toISOString().split("T")[0], // Convert date to yyyy-mm-dd
        endDate: endDate.toISOString().split("T")[0], // Convert date to yyyy-mm-dd
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

    // Use the same date displayed in the DataGrid
    const formattedData = reportData.map(
      ({
        deliveryDate, // Use the already formatted date
        itemType,
        itemDescription,
        sizeOrSource,
        quantity,
        serialNumber,
        deliveryNumber,
        checkoutNumber,
      }) => [
        deliveryDate || "", // Directly use the date as displayed in the table
        itemType || "",
        itemDescription || "",
        sizeOrSource || "",
        quantity || "",
        serialNumber || "",
        isDeliveryReport ? deliveryNumber || "" : checkoutNumber || "",
      ]
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

    // **Ensure Excel treats the date as plain text to avoid auto-formatting issues**
    formattedData.forEach((row, rowIndex) => {
      const cellRef = XLSX.utils.encode_cell({ r: rowIndex + 1, c: 0 }); // Date column (first column)
      if (worksheet[cellRef]) {
        worksheet[cellRef].t = "s"; // Force text format
      }
    });

    // Set column widths dynamically
    worksheet["!cols"] = headers[0].map((header) => ({
      wch: header.length + 5,
    }));

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
          <LocalizationProvider dateAdapter={AdapterDateFns} locale={enGB}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(date) => setStartDate(date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(date) => setEndDate(date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
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
          autoHeight
          rowHeight={45}
        />
      </div>

      <Button
        variant="contained"
        color="success"
        style={{ marginTop: "20px", width: "100%" }}
        onClick={exportToExcel} // Trigger export function
      >
        Export to Excel
      </Button>
    </div>
  );
};

export default GenerateReports;
