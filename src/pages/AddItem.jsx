import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import {
  TextField,
  Button,
  Grid,
  Typography,
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Container,
  Paper,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

const AddItem = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [items, setItems] = useState([]);
  const [itemType, setItemType] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [sizeSource, setSizeSource] = useState("");
  const [serialNo, setSerialNo] = useState("");
  const [successMessage, setSuccessMessage] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
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

    const getItems = async () => {
      try {
        const response = await axiosInstance.get("/get-items");
        if (response.data && response.data.items) {
          setItems(response.data.items);
        }
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    };

    getUserInfo();
    getItems();
  }, [navigate]);

  const columns = [
    { field: "itemType", headerName: "Item Type", flex: 1, minWidth: 150 },
    {
      field: "itemDesc",
      headerName: "Item Description",
      flex: 2,
      minWidth: 200,
    },
    { field: "sizeSource", headerName: "Size/Source", flex: 1, minWidth: 150 },
    { field: "serialNo", headerName: "Serial Number", flex: 1, minWidth: 150 },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      minWidth: 120,
      sortable: false,
      renderCell: (params) => {
        return (
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() => handleDelete(params.row._id)}
          >
            Delete
          </Button>
        );
      },
    },
  ];

  const itemTypes = [
    "Jacket",
    "P.E. Uniform",
    "Regular Uniform",
    "Scouting",
    "School Supplies",
    "Office Supplies",
    "Books",
    "Graduation",
    "Others",
  ];

  const handleAddItem = async () => {
    if (itemType && itemDesc && sizeSource && serialNo) {
      try {
        const response = await axiosInstance.post("/add-item", {
          itemType,
          itemDesc,
          sizeSource,
          serialNo,
        });

        if (response.status === 200) {
          const newItem = { ...response.data.item, id: response.data.item._id };
          setItems([...items, newItem]);
          setItemType("");
          setItemDesc("");
          setSizeSource("");
          setSerialNo("");

          setSuccessMessage(true);
          setTimeout(() => setSuccessMessage(false), 3000);
        } else {
          alert("Error: " + (response.data.message || "Failed to add item"));
        }
      } catch (error) {
        alert(
          "Error: " + (error.response?.data?.message || "Failed to add item")
        );
      }
    } else {
      alert("Please fill all fields!");
    }
  };

  return (
    <>
      <Navbar userInfo={userInfo} />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 3, textAlign: "center" }}>
          {successMessage && (
            <Alert
              severity="success"
              onClose={() => setSuccessMessage(false)}
              sx={{ mb: 2 }}
            >
              Item successfully added!
            </Alert>
          )}

          <Grid container spacing={3} justifyContent="center">
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Item Type</InputLabel>
                <Select
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                >
                  {itemTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Item Description"
                value={itemDesc}
                onChange={(e) => setItemDesc(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Size/Source"
                value={sizeSource}
                onChange={(e) => setSizeSource(e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Serial Number"
                value={serialNo}
                onChange={(e) => setSerialNo(e.target.value)}
                fullWidth
              />
            </Grid>
          </Grid>

          <Box mt={3}>
            <Button variant="contained" color="primary" onClick={handleAddItem}>
              Add Item
            </Button>
          </Box>
        </Paper>

        <Box mt={4}>
          <DataGrid
            rows={items}
            columns={columns}
            pageSize={5}
            disableSelectionOnClick
            getRowId={(row) => row._id}
            sx={{ height: 400 }}
          />
        </Box>
      </Container>
    </>
  );
};

export default AddItem;
