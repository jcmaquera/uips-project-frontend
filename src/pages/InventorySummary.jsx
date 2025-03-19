import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { Paper, Grid, Typography, Button, TextField } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid"; // Import DataGrid component
import * as XLSX from "xlsx"; // Importing XLSX library

const InventorySummary = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [inventoryData, setInventoryData] = useState([]);
  const [searchQuery, setSearchQuery] = useState(""); // State to hold search query
  const [filteredData, setFilteredData] = useState([]); // State for filtered data
  const [pageSize, setPageSize] = useState(5); // Default page size

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
      setInventoryData(mappedData); // Store mapped data
      setFilteredData(mappedData); // Initialize filtered data
    } catch (error) {
      console.error("Error fetching inventory data:", error);
    }
  };

  // Filter data based on search query
  const handleSearch = (event) => {
    setSearchQuery(event.target.value);

    const filtered = inventoryData.filter((row) => {
      // Use a fallback to empty string if the field is undefined or null
      const itemType = row.itemType ? row.itemType.toLowerCase() : "";
      const itemDescription = row.itemDescription
        ? row.itemDescription.toLowerCase()
        : "";
      const serialNumber = row.serialNumber
        ? row.serialNumber.toLowerCase()
        : "";
      const sizeOrSource = row.sizeOrSource
        ? row.sizeOrSource.toLowerCase()
        : "";

      return (
        itemType.includes(event.target.value.toLowerCase()) ||
        itemDescription.includes(event.target.value.toLowerCase()) ||
        serialNumber.includes(event.target.value.toLowerCase()) ||
        sizeOrSource.includes(event.target.value.toLowerCase())
      );
    });

    setFilteredData(filtered);
  };

  // Export to Excel function
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData); // Convert filtered data to worksheet
    const workbook = XLSX.utils.book_new(); // Create new workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory"); // Add sheet to workbook

    // Export and download the Excel file
    XLSX.writeFile(workbook, "inventory_summary.xlsx");
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
    { field: "quantity", headerName: "Quantity", flex: 1, minWidth: 100 },
    {
      field: "serialNumber",
      headerName: "Serial Number",
      flex: 1,
      minWidth: 130,
    },
    {
      field: "sizeOrSource",
      headerName: "Size/Source",
      flex: 1,
      minWidth: 120,
    },
  ];

  return (
    <div>
      <Navbar userInfo={userInfo} />

      <Paper sx={{ padding: 3, marginTop: 3 }}>
        <Typography variant="h5" gutterBottom>
          Inventory Summary
        </Typography>

        {/* Search Bar */}
        <TextField
          label="Search Inventory"
          variant="outlined"
          fullWidth
          value={searchQuery}
          onChange={handleSearch}
          style={{ marginBottom: "20px" }}
        />

        {/* DataGrid Table for Inventory */}
        <div style={{ height: 400, width: "100%", marginTop: "20px" }}>
          <DataGrid
            rows={filteredData}
            columns={columns}
            pageSize={pageSize}
            disableSelectionOnClick
            sx={{
              ".MuiDataGrid-columnHeader": {
                fontWeight: "bold",
                fontSize: "0.85rem", // Smaller font size for headers
              },
              "& .MuiDataGrid-cell": {
                fontSize: "0.85rem", // Smaller font size for content
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
      </Paper>
    </div>
  );
};

export default InventorySummary;
