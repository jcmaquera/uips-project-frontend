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
import * as XLSX from "xlsx"; // Importing XLSX library

const GenerateReports = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [inventoryData, setInventoryData] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [openDateDialog, setOpenDateDialog] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isDeliveryReport, setIsDeliveryReport] = useState(true); // Flag for report type

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
        setOpenDateDialog(false); // Close date picker dialog
      }
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report.");
    }
  };

  // Export to Excel function
  const exportToExcel = () => {
    const formattedData = reportData.map(({ 
      itemType, 
      itemDescription, 
      sizeOrSource, 
      quantity, 
      serialNumber, 
      deliveryNumber 
    }) => ({
      "Item Type": itemType,
      "Item Description": itemDescription,
      "Size/Source": sizeOrSource,
      "Quantity": quantity,
      "Serial Number": serialNumber,
      "Delivery Number": deliveryNumber || "", 
    }));
  
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
  
    // Adjust column order manually
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  
    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, "report.xlsx");
  };
  

  useEffect(() => {
    getUserInfo();
    fetchInventoryData();
  }, []);

  const columns = [
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
    {
      field: "deliveryNumber",
      headerName: "Delivery Number",
      flex: 1,
      minWidth: 100,
      hide: !isDeliveryReport, // Hide this column if it's not a delivery report
    },
  ];
  

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
