import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { TextField, Button, Grid, Paper } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

const GenerateReports = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [inventoryData, setInventoryData] = useState([]);

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
      // Map the data to match the DataGrid row structure
      const mappedData = response.data.map((inventory) => ({
        id: inventory._id, // Use _id from MongoDB as the row id
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

  useEffect(() => {
    getUserInfo();
    fetchInventoryData();
  }, []);

  // Column definition for DataGrid (without "Date" column)
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
  ];

  return (
    <div>
      <Navbar userInfo={userInfo} />
      <Paper sx={{ padding: 2, marginTop: 2 }}>
        {/* Top Row - Buttons */}
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
        </Grid>
      </Paper>

      {/* DataGrid Table to Display Inventory */}
      <div style={{ height: 400, width: "100%", marginTop: "20px" }}>
        <DataGrid
          rows={inventoryData}
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
