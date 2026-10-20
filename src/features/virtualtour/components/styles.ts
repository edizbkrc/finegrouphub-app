import { styled } from "@mui/material/styles";
import { Box } from "@mui/material";

// Hotspot CSS (will be added as a style tag)
export const hotspotCSS = `
  .hotspot {
    position: absolute;
    cursor: grab;
    touch-action: none;
    user-select: none;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    border: 3px solid white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    z-index: 1000;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    backdrop-filter: blur(10px);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 4px 20px rgba(0,0,0,0.3), 0 0 0 0 rgba(255,255,255,0.7);
    }
    70% {
      box-shadow: 0 4px 20px rgba(0,0,0,0.3), 0 0 0 10px rgba(255,255,255,0);
    }
    100% {
      box-shadow: 0 4px 20px rgba(0,0,0,0.3), 0 0 0 0 rgba(255,255,255,0);
    }
  }

  .hotspot-dragging,
  .hotspot-dragging:hover {
    cursor: grabbing;
    transform: scale(1.15);
    animation: none;
  }

  .hotspot:hover {
    transform: scale(1.3);
    box-shadow: 0 8px 30px rgba(0,0,0,0.4);
    animation: none;
  }

  .info-hotspot {
    background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
    border-color: #ffffff;
    color: #ffffff;
  }

  .info-hotspot:hover {
    background: linear-gradient(135deg, #3A7BD5 0%, #2968A3 100%);
    border-color: #f0f0f0;
  }

  .link-hotspot {
    background: linear-gradient(135deg, #5DADE2 0%, #3498DB 100%);
    border-color: #ffffff;
    color: #ffffff;
  }

  .link-hotspot:hover {
    background: linear-gradient(135deg, #4A9BD1 0%, #2980B9 100%);
    border-color: #f0f0f0;
  }

  .hotspot-tooltip {
    position: absolute;
    bottom: 50px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(30,30,30,0.9) 100%);
    color: white;
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    white-space: normal;
    display: none;
    z-index: 1001;
    max-width: 250px;
    text-align: center;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.2);
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  }

  .hotspot-tooltip::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -8px;
    border-width: 8px;
    border-style: solid;
    border-color: rgba(0,0,0,0.9) transparent transparent transparent;
  }

  .hotspot-label {
    position: absolute;
    bottom: 50px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(30,30,30,0.9) 100%);
    color: white;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    display: none;
    z-index: 1001;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.2);
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  }

  .link-hotspot:hover .hotspot-label {
    display: block;
  }

  .hotspot-icon {
    pointer-events: none;
    font-size: 20px;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    color: #f0f0f0;
    text-shadow: 0 1px 3px rgba(37, 99, 235, 0.5);
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  .hotspot-icon svg {
    width: 20px;
    height: 20px;
    fill: #f0f0f0;
    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
    display: block;
    margin: auto;
  }

  /* Responsive hotspots for smaller screens */
    font-size: 20px;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
  }

  /* Responsive hotspots for smaller screens */
  @media (max-width: 768px) {
    .hotspot {
      width: 35px;
      height: 35px;
      font-size: 16px;
    }
    
    .hotspot-icon {
      font-size: 18px;
    }
    
    .hotspot-icon svg {
      width: 18px;
      height: 18px;
    }
    
    .hotspot-tooltip {
      max-width: 200px;
      font-size: 13px;
      padding: 10px 14px;
    }
  }
`;

// Main panorama container
export const PanoramaContainer = styled("div", {
  shouldForwardProp: (prop) =>
    prop !== "isDragOver" && prop !== "editMode" && prop !== "scenes",
})<{
  scenes: number;
  editMode: string;
  isDragOver?: boolean;
}>(({ scenes, editMode, isDragOver }) => ({
  width: "100%",
  height: "calc(100vh - 64px)",
  background:
    scenes === 0
      ? "linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #475569 75%, #64748b 100%)"
      : "#000",
  cursor: editMode !== "none" ? "crosshair" : "grab",
  position: "relative",
  overflow: "hidden",
  ...(isDragOver && {
    background: "rgba(52, 152, 219, 0.2)",
    transform: "scale(1.01)",
    boxShadow: "0 2px 8px rgba(52, 152, 219, 0.2)",
  }),
}));

// Animated background for empty state
export const AnimatedBackground = styled("div")({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: `
    radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(119, 198, 255, 0.1) 0%, transparent 50%)
  `,
  animation: "float 6s ease-in-out infinite",
  "@keyframes float": {
    "0%, 100%": { opacity: 0.3 },
    "50%": { opacity: 0.6 },
  },
});

// Empty state container
export const EmptyStateContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isDragOver",
})<{ isDragOver?: boolean }>(({ isDragOver }) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: isDragOver
    ? "translate(-50%, -50%) scale(1.05)"
    : "translate(-50%, -50%)",
  textAlign: "center",
  color: "white",
  zIndex: 1000,
  background: isDragOver ? "rgba(52, 152, 219, 0.2)" : "rgba(26, 35, 126, 0.1)",
  borderRadius: "20px",
  padding: "40px",
  backdropFilter: "blur(15px)",
  border: isDragOver
    ? "2px dashed rgba(52, 152, 219, 0.8)"
    : "1px solid rgba(255,255,255,0.1)",
  boxShadow: isDragOver
    ? "0 30px 60px rgba(52, 152, 219, 0.3)"
    : "0 20px 40px rgba(0,0,0,0.3)",
  maxWidth: "500px",
  cursor: "pointer",
  transition: "all 0.3s ease",
  "&:hover": {
    background: "rgba(52, 152, 219, 0.15)",
    borderColor: "rgba(52, 152, 219, 0.5)",
    transform: "translate(-50%, -50%) scale(1.02)",
    boxShadow: "0 25px 50px rgba(52, 152, 219, 0.2)",
  },
}));

// Icon container for empty state
export const IconContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isDragOver",
})<{ isDragOver?: boolean }>(({ isDragOver }) => ({
  width: "80px",
  height: "80px",
  borderRadius: "50%",
  border: isDragOver
    ? "2px solid rgba(52, 152, 219, 0.8)"
    : "2px solid rgba(255,255,255,0.3)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 20px",
  background: isDragOver ? "rgba(52, 152, 219, 0.2)" : "rgba(255,255,255,0.1)",
  transition: "all 0.3s ease",
}));

// Hotspot styles
export const HotspotBase = styled("div")({
  position: "absolute",
  cursor: "pointer",
  borderRadius: "50%",
  width: "20px",
  height: "20px",
  border: "2px solid white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "scale(1.2)",
    boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
  },
});

export const InfoHotspot = styled(HotspotBase)({
  backgroundColor: "#2196F3",
  "&:hover": {
    backgroundColor: "#1976D2",
  },
  "& .hotspot-tooltip": {
    position: "absolute",
    bottom: "25px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "rgba(0,0,0,0.8)",
    color: "white",
    padding: "8px 12px",
    borderRadius: "4px",
    fontSize: "12px",
    whiteSpace: "nowrap",
    display: "none",
    zIndex: 1000,
    "&::after": {
      content: '""',
      position: "absolute",
      top: "100%",
      left: "50%",
      marginLeft: "-5px",
      borderWidth: "5px",
      borderStyle: "solid",
      borderColor: "rgba(0,0,0,0.8) transparent transparent transparent",
    },
  },
});

export const LinkHotspot = styled(HotspotBase)({
  backgroundColor: "#FF5722",
  "&:hover": {
    backgroundColor: "#D84315",
  },
  "& .hotspot-label": {
    position: "absolute",
    bottom: "25px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "rgba(0,0,0,0.8)",
    color: "white",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "10px",
    whiteSpace: "nowrap",
    display: "none",
    zIndex: 1000,
  },
  "&:hover .hotspot-label": {
    display: "block",
  },
});

// Upload area styles
export const UploadArea = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isDragOver",
})<{ isDragOver?: boolean }>(({ isDragOver }) => ({
  marginBottom: "24px",
  padding: "16px",
  border: isDragOver ? "2px dashed #2980b9" : "1px dashed #3498db",
  borderRadius: "8px",
  backgroundColor: isDragOver
    ? "rgba(52, 152, 219, 0.08)"
    : "rgba(52, 152, 219, 0.03)",
  cursor: "pointer",
  textAlign: "center",
  transition: "all 0.2s ease",
  "&:hover": {
    borderColor: "#2980b9",
    backgroundColor: "rgba(52, 152, 219, 0.08)",
    transform: "translateY(-1px)",
  },
  ...(isDragOver && {
    transform: "scale(1.01)",
    boxShadow: "0 2px 8px rgba(52, 152, 219, 0.2)",
  }),
}));

// Scene list item styles
export const SceneListItem = styled(Box)<{ isActive?: boolean }>(
  ({ isActive }) => ({
    paddingLeft: "16px",
    paddingRight: "16px",
    paddingTop: "12px",
    paddingBottom: "12px",
    marginBottom: "8px",
    marginLeft: 0,
    marginRight: 0,
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    border: "1px solid #e1e8ed",
    transition: "all 0.2s ease",
    cursor: "pointer",
    "&:hover": {
      boxShadow: "0 2px 8px rgba(52, 152, 219, 0.15)",
      borderColor: "#3498db",
      transform: "translateY(-1px)",
    },
    ...(isActive && {
      backgroundColor: "#3498db !important",
      color: "white",
      borderColor: "#2980b9",
      boxShadow: "0 2px 12px rgba(52, 152, 219, 0.3)",
      "&:hover": {
        backgroundColor: "#2980b9 !important",
        transform: "translateY(-1px)",
      },
      "& .MuiListItemText-primary": {
        color: "white !important",
        fontWeight: 600,
      },
      "& .MuiListItemText-secondary": {
        color: "rgba(255, 255, 255, 0.8) !important",
      },
      "& .MuiIconButton-root": {
        color: "white !important",
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        "&:hover": {
          backgroundColor: "rgba(255, 255, 255, 0.2)",
        },
      },
      "& .MuiChip-root": {
        backgroundColor: "rgba(255, 255, 255, 0.2) !important",
        color: "white !important",
        fontWeight: 600,
      },
    }),
  })
);

// Camera info panel
export const CameraInfoPanel = styled(Box)({
  padding: "24px",
  marginBottom: "16px",
  backgroundColor: "#ffffff",
  border: "1px solid #e1e8ed",
  borderRadius: "8px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
});
