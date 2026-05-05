import { Response } from "express";
import type { AuthRequest } from "../../dtos/auth";
import {
  AdminAccountPackageError,
  adminAccountPackageService,
} from "../../services/adminAccountPackage.service.ts";
import { adminAccountPackageTrackingService } from "../../services/adminAccountPackageTracking.service";

export const getAccountPackages = async (
  _req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const catalog = await adminAccountPackageService.getCatalog();
    res.json(catalog);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Không thể tải gói tài khoản / shop.",
    });
  }
};

export const getAccountPackageTracking = async (
  _req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const payload = await adminAccountPackageTrackingService.getTracking();
    res.json(payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Không thể tải danh sách theo dõi gói tài khoản / shop.",
    });
  }
};

export const updateAccountPackage = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const packageCode = String(req.params.code ?? "").trim().toUpperCase();

    if (!adminAccountPackageService.isSupportedCode(packageCode)) {
      res.status(400).json({
        error: "Mã gói tài khoản / shop không hợp lệ.",
      });
      return;
    }

    const updatedPackage = await adminAccountPackageService.updatePackage({
      code: packageCode,
      title: req.body?.title,
      price: req.body?.price,
      maxSales: req.body?.maxSales,
      durationDays: req.body?.durationDays,
      adminId: req.user?.id ?? null,
      adminEmail: req.user?.email ?? null,
    });

    res.json(updatedPackage);
  } catch (error) {
    console.error(error);
    if (error instanceof AdminAccountPackageError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({
      error: "Không thể cập nhật gói tài khoản / shop. Vui lòng kiểm tra lại dữ liệu nhập.",
    });
  }
};
