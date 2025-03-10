import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { TextField, Button, Grid, Box, Typography, Paper } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

const GenerateReports = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [inventoryData, setInventoryData] = useState([]);
  const [date1, setDate1] = useState("");
  const [date2, setDate2] = useState("");

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

  // Fetch inventory data (mock data for now)
  const fetchInventoryData = async () => {
    const mockData = [
      {
        id: 1,
        itemType: "Electronics",
        itemDescription: "Smartphone",
        sizeOrSource: "Medium",
        quantity: 100,
        serialNumber: "SN123",
        date: "2025-03-05",
      },
      {
        id: 2,
        itemType: "Furniture",
        itemDescription: "Table",
        sizeOrSource: "Large",
        quantity: 50,
        serialNumber: "SN124",
        date: "2025-03-08",
      },
      {
        id: 3,
        itemType: "Clothing",
        itemDescription: "T-shirt",
        sizeOrSource: "Small",
        quantity: 200,
        serialNumber: "SN125",
        date: "2025-03-12",
      },
    ];
    setInventoryData(mockData);
  };

  useEffect(() => {
    getUserInfo();
    fetchInventoryData();
    return () => {};
  }, []);

  // Column definition for DataGrid (matching AddItem fields)
  const columns = [
    { field: "itemType", headerName: "Item Type", flex: 1, minWidth: 150 },
    {
      field: "itemDescription",
      headerName: "Item Description",
      flex: 2,
      minWidth: 200,
    },
    {
      field: "sizeOrSource",
      headerName: "Size/Source",
      flex: 1,
      minWidth: 150,
    },
    { field: "quantity", headerName: "Quantity", flex: 1, minWidth: 150 },
    {
      field: "serialNumber",
      headerName: "Serial Number",
      flex: 1,
      minWidth: 150,
    },
    { field: "date", headerName: "Date", flex: 1, minWidth: 150 },
  ];

  // Filter data by date range (date1 to date2)
  const filteredData = inventoryData.filter((row) => {
    if (date1 && date2) {
      return (
        new Date(row.date) >= new Date(date1) &&
        new Date(row.date) <= new Date(date2)
      );
    }
    return true;
  });

  return (
    <div>
      <Navbar userInfo={userInfo} />
      <Paper sx={{ padding: 2, marginTop: 2 }}>
        {/* Top Row - Buttons and Date Filters */}
        <Grid
          container
          spacing={3}
          alignItems="center"
          justifyContent="space-between"
        >
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              style={{ marginRight: "10px" }}
            >
              Report by Delivery Number
            </Button>
            <Button
              variant="contained"
              color="secondary"
              style={{ marginRight: "10px" }}
            >
              Report by Invoice Number
            </Button>
          </Grid>
          <Grid item xs={6} container spacing={2} justifyContent="flex-end">
            <Grid item>
              <TextField
                type="date"
                label="Date 1"
                value={date1}
                onChange={(e) => setDate1(e.target.value)}
                InputLabelProps={{ shrink: true }}
                style={{ width: 160 }}
              />
            </Grid>
            <Grid item>
              <TextField
                type="date"
                label="Date 2"
                value={date2}
                onChange={(e) => setDate2(e.target.value)}
                InputLabelProps={{ shrink: true }}
                style={{ width: 160 }}
              />
            </Grid>
            <Grid item>
              <Button variant="contained" color="success">
                Report by Date Range
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* DataGrid Table to Display Inventory */}
      <div style={{ height: 400, width: "100%", marginTop: "20px" }}>
        <DataGrid
          rows={filteredData}
          columns={columns}
          pageSize={5}
          disableSelectionOnClick
          sx={{
            ".MuiDataGrid-columnHeader": {
              fontWeight: "bold",
            },
            width: "100%",
          }}
        />
      </div>
    </div>
  );
};

export default GenerateReports;
