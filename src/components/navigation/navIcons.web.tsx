import { AntDesign, Entypo } from '@expo/vector-icons';
import React from 'react';
import { BiCoin, BiSolidCoin } from 'react-icons/bi';
import { BsFileEarmarkExcel, BsFileEarmarkExcelFill } from 'react-icons/bs';
import { HiCurrencyDollar, HiOutlineCurrencyDollar, HiOutlineUsers, HiUsers } from 'react-icons/hi2';
import { MdAccountCircle, MdOutlineAccountCircle } from 'react-icons/md';
import { TbReceiptDollar, TbReceiptDollarFilled } from 'react-icons/tb';

export type NavIconProps = { size: number; color: string };

export const HomeIcon             = (p: NavIconProps) => <AntDesign name="home"  size={p.size} color={p.color} />;
export const HomeActiveIcon       = (p: NavIconProps) => <Entypo    name="home"  size={p.size} color={p.color} />;

export const McprIcon             = (p: NavIconProps) => <TbReceiptDollar          size={p.size} color={p.color} />;
export const McprActiveIcon       = (p: NavIconProps) => <TbReceiptDollarFilled    size={p.size} color={p.color} />;

export const PaymentIcon          = (p: NavIconProps) => <HiOutlineCurrencyDollar  size={p.size} color={p.color} />;
export const PaymentActiveIcon    = (p: NavIconProps) => <HiCurrencyDollar         size={p.size} color={p.color} />;

export const DisbursementIcon       = (p: NavIconProps) => <BiCoin                 size={p.size} color={p.color} />;
export const DisbursementActiveIcon = (p: NavIconProps) => <BiSolidCoin            size={p.size} color={p.color} />;

export const PlanMgmtIcon         = (p: NavIconProps) => <HiOutlineUsers          size={p.size} color={p.color} />;
export const PlanMgmtActiveIcon   = (p: NavIconProps) => <HiUsers                 size={p.size} color={p.color} />;

export const DocCancelIcon        = (p: NavIconProps) => <BsFileEarmarkExcel      size={p.size} color={p.color} />;
export const DocCancelActiveIcon  = (p: NavIconProps) => <BsFileEarmarkExcelFill  size={p.size} color={p.color} />;

export const ProfileIcon          = (p: NavIconProps) => <MdOutlineAccountCircle  size={p.size} color={p.color} />;
export const ProfileActiveIcon    = (p: NavIconProps) => <MdAccountCircle         size={p.size} color={p.color} />;
