export type PlotStatus = 'available' | 'booked' | 'sold' | 'reserved' | 'cancelled'
export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'partial'

export interface Society {
  id: string
  name: string
  developer: string
  address: string
  city: string
  country: string
  totalPlots: number
  available: number
  booked: number
  sold: number
  reserved: number
  status: 'active' | 'pre-launch' | 'completed'
  color: string
  blocks: string[]
  description: string
  masterPlan: string
}

export interface Plot {
  id: string
  number: string
  societyId: string
  societyName: string
  block: string
  size: string
  category: string
  price: number
  facing: string
  corner: boolean
  status: PlotStatus
  customerId?: string
  bookingId?: string
}

export interface Customer {
  id: string
  name: string
  fatherName: string
  cnic: string
  phone: string
  whatsapp: string
  email: string
  address: string
  city: string
  occupation: string
  dob: string
  plots: string[]
  photo?: string
}

export interface Booking {
  id: string
  bookingNumber: string
  customerId: string
  customerName: string
  plotId: string
  plotNumber: string
  societyId: string
  societyName: string
  block: string
  plotSize: string
  totalAmount: number
  downPayment: number
  monthlyInstallment: number
  remainingBalance: number
  bookingDate: string
  possessionDate: string
  dealerId: string
  dealerName: string
  status: 'active' | 'completed' | 'cancelled' | 'transferred'
  installmentsPaid: number
  totalInstallments: number
}

export interface Payment {
  id: string
  receiptNumber: string
  bookingId: string
  bookingNumber: string
  customerId: string
  customerName: string
  societyName: string
  plotNumber: string
  amount: number
  type: 'down-payment' | 'installment' | 'development-charges' | 'transfer-fee'
  date: string
  status: PaymentStatus
  collectedBy: string
  notes: string
}

export interface Dealer {
  id: string
  name: string
  phone: string
  email: string
  city: string
  societies: string[]
  totalBookings: number
  totalRevenue: number
  commission: number
  rating: number
  joinDate: string
  status: 'active' | 'inactive'
  photo?: string
}

export interface Investor {
  id: string
  name: string
  phone: string
  investmentAmount: number
  roi: number
  profit: number
  projects: string[]
  joinDate: string
  status: 'active' | 'completed'
  photo?: string
}

export const societies: Society[] = [
  {
    id: 'S1',
    name: 'Al-Khidmat Heights',
    developer: 'Al-Khidmat Group',
    address: 'Main GT Road, Near Toll Plaza',
    city: 'Gujranwala',
    country: 'Pakistan',
    totalPlots: 800,
    available: 312,
    booked: 188,
    sold: 272,
    reserved: 28,
    status: 'active',
    color: '#0F766E',
    blocks: ['Block A', 'Block B', 'Block C', 'Executive Block', 'Commercial Block'],
    description: 'Premium residential society with world-class amenities, parks, mosque, and commercial zone.',
    masterPlan: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=600&fit=crop',
  },
  {
    id: 'S2',
    name: 'Green Valley Enclave',
    developer: 'GVE Developers',
    address: 'Bedian Road, Lahore Bypass',
    city: 'Lahore',
    country: 'Pakistan',
    totalPlots: 500,
    available: 198,
    booked: 120,
    sold: 165,
    reserved: 17,
    status: 'active',
    color: '#2563EB',
    blocks: ['Block A', 'Block B', 'Overseas Block', 'VIP Block'],
    description: 'Lush green community with eco-friendly construction and premium lifestyle amenities.',
    masterPlan: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop',
  },
  {
    id: 'S3',
    name: 'Golden Palms Residencia',
    developer: 'Al-Khidmat Group',
    address: 'Chakri Road, Near Islamabad Highway',
    city: 'Rawalpindi',
    country: 'Pakistan',
    totalPlots: 600,
    available: 390,
    booked: 95,
    sold: 100,
    reserved: 15,
    status: 'pre-launch',
    color: '#C9A227',
    blocks: ['Block A', 'Block B', 'Block C', 'Executive Block'],
    description: 'Newly launched luxury project with innovative architecture and smart home features.',
    masterPlan: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&h=600&fit=crop',
  },
]

// Generate plots for map view
const plotStatuses: PlotStatus[] = ['available', 'available', 'available', 'booked', 'sold', 'reserved', 'available', 'sold', 'available', 'booked']

export const plots: Plot[] = []
let plotIdx = 0
societies.forEach(soc => {
  soc.blocks.forEach(block => {
    for (let i = 1; i <= 20; i++) {
      const status = plotStatuses[(plotIdx + i) % plotStatuses.length]
      plots.push({
        id: `${soc.id}-${block}-${i}`,
        number: `${block.replace('Block ', '').replace(' Block', '')}-${String(i).padStart(3, '0')}`,
        societyId: soc.id,
        societyName: soc.name,
        block,
        size: ['5 Marla', '10 Marla', '1 Kanal', '3 Marla', '7 Marla'][i % 5],
        category: ['Residential', 'Commercial', 'Residential', 'Residential', 'Commercial'][i % 5],
        price: [2800000, 5500000, 11000000, 1600000, 4200000][i % 5],
        facing: ['North', 'South', 'East', 'West', 'Corner', 'Park'][i % 6],
        corner: i % 7 === 0,
        status,
      })
      plotIdx++
    }
  })
})

export const customers: Customer[] = [
  { id: 'C1', name: 'Muhammad Asif Khan', fatherName: 'Abdul Rehman Khan', cnic: '35202-1234567-9', phone: '0300-1234567', whatsapp: '0300-1234567', email: 'asif.khan@gmail.com', address: 'House 45, Street 12, Model Town', city: 'Gujranwala', occupation: 'Businessman', dob: '1978-04-15', plots: ['S1-Block A-001', 'S1-Block B-005'] },
  { id: 'C2', name: 'Fatima Malik', fatherName: 'Tariq Malik', cnic: '35401-9876543-2', phone: '0321-9876543', whatsapp: '0321-9876543', email: 'fatima.malik@yahoo.com', address: 'Flat 3B, Gulshan Apartments', city: 'Lahore', occupation: 'Teacher', dob: '1985-09-22', plots: ['S2-Block A-003'] },
  { id: 'C3', name: 'Zubair Ahmed Siddiqui', fatherName: 'Ahmed Siddiqui', cnic: '61101-4567890-1', phone: '0333-4567890', whatsapp: '0333-4567890', email: 'zubair.ahmed@hotmail.com', address: 'House 7, Sector F-11', city: 'Islamabad', occupation: 'Engineer', dob: '1982-11-08', plots: ['S3-Block A-002'] },
  { id: 'C4', name: 'Hafiz Abdul Razzaq', fatherName: 'Muhammad Razzaq', cnic: '35202-7654321-5', phone: '0345-7654321', whatsapp: '0345-7654321', email: 'h.razzaq@gmail.com', address: 'Mohalla Anwarabad, Shahdara', city: 'Lahore', occupation: 'Retired Officer', dob: '1965-03-30', plots: ['S1-Block C-008'] },
  { id: 'C5', name: 'Ayesha Nawaz Butt', fatherName: 'Nawaz Ahmad Butt', cnic: '35201-3698521-4', phone: '0311-3698521', whatsapp: '0311-3698521', email: 'ayesha.nawaz@gmail.com', address: 'House 22, Wapda Town', city: 'Gujranwala', occupation: 'Doctor', dob: '1990-07-14', plots: ['S1-Executive Block-001'] },
  { id: 'C6', name: 'Imran Hussain Gondal', fatherName: 'Hussain Gondal', cnic: '35302-1472583-7', phone: '0300-1472583', whatsapp: '0300-1472583', email: 'imran.gondal@gmail.com', address: 'Gondal House, Sialkot Road', city: 'Gujranwala', occupation: 'Agriculturist', dob: '1975-12-01', plots: ['S2-VIP Block-002', 'S2-Overseas Block-001'] },
  { id: 'C7', name: 'Sana Tariq Cheema', fatherName: 'Tariq Cheema', cnic: '35202-9630741-3', phone: '0322-9630741', whatsapp: '0322-9630741', email: 'sana.cheema@yahoo.com', address: 'House 89, DHA Phase 2', city: 'Lahore', occupation: 'Lawyer', dob: '1987-05-19', plots: ['S2-Block B-006'] },
  { id: 'C8', name: 'Raja Muhammad Usman', fatherName: 'Raja Asghar Ali', cnic: '37405-8520369-2', phone: '0346-8520369', whatsapp: '0346-8520369', email: 'raja.usman@gmail.com', address: 'Raja Mahal, G.T. Road', city: 'Rawalpindi', occupation: 'Contractor', dob: '1972-08-25', plots: ['S3-Block B-004'] },
  { id: 'C9', name: 'Nadia Pervaiz Akhtar', fatherName: 'Pervaiz Akhtar', cnic: '35202-7413698-8', phone: '0333-7413698', whatsapp: '0333-7413698', email: 'nadia.akhtar@gmail.com', address: 'House 156, Satellite Town', city: 'Rawalpindi', occupation: 'Pharmacist', dob: '1989-02-14', plots: ['S1-Block A-010'] },
  { id: 'C10', name: 'Khalid Mehmood Rana', fatherName: 'Mehmood Rana', cnic: '35202-1597534-6', phone: '0301-1597534', whatsapp: '0301-1597534', email: 'khalid.rana@hotmail.com', address: 'Street 5, Block J, Johar Town', city: 'Lahore', occupation: 'Banker', dob: '1980-10-31', plots: ['S2-Block A-012'] },
]

export const bookings: Booking[] = [
  { id: 'B1', bookingNumber: 'AKG-2025-001', customerId: 'C1', customerName: 'Muhammad Asif Khan', plotId: 'S1-Block A-001', plotNumber: 'A-001', societyId: 'S1', societyName: 'Al-Khidmat Heights', block: 'Block A', plotSize: '10 Marla', totalAmount: 5500000, downPayment: 1100000, monthlyInstallment: 73333, remainingBalance: 2933320, bookingDate: '2025-01-15', possessionDate: '2027-01-15', dealerId: 'D1', dealerName: 'Tariq Mahmood', status: 'active', installmentsPaid: 18, totalInstallments: 60 },
  { id: 'B2', bookingNumber: 'AKG-2025-002', customerId: 'C2', customerName: 'Fatima Malik', plotId: 'S2-Block A-003', plotNumber: 'A-003', societyId: 'S2', societyName: 'Green Valley Enclave', block: 'Block A', plotSize: '5 Marla', totalAmount: 2800000, downPayment: 560000, monthlyInstallment: 37333, remainingBalance: 1679985, bookingDate: '2025-02-20', possessionDate: '2027-02-20', dealerId: 'D2', dealerName: 'Asad Ullah Khan', status: 'active', installmentsPaid: 12, totalInstallments: 60 },
  { id: 'B3', bookingNumber: 'AKG-2025-003', customerId: 'C3', customerName: 'Zubair Ahmed Siddiqui', plotId: 'S3-Block A-002', plotNumber: 'A-002', societyId: 'S3', societyName: 'Golden Palms Residencia', block: 'Block A', plotSize: '1 Kanal', totalAmount: 11000000, downPayment: 2200000, monthlyInstallment: 146667, remainingBalance: 7186683, bookingDate: '2025-03-10', possessionDate: '2027-03-10', dealerId: 'D1', dealerName: 'Tariq Mahmood', status: 'active', installmentsPaid: 8, totalInstallments: 60 },
  { id: 'B4', bookingNumber: 'AKG-2024-089', customerId: 'C4', customerName: 'Hafiz Abdul Razzaq', plotId: 'S1-Block C-008', plotNumber: 'C-008', societyId: 'S1', societyName: 'Al-Khidmat Heights', block: 'Block C', plotSize: '5 Marla', totalAmount: 2800000, downPayment: 700000, monthlyInstallment: 42000, remainingBalance: 0, bookingDate: '2024-06-05', possessionDate: '2026-06-05', dealerId: 'D3', dealerName: 'Bilal Aslam', status: 'completed', installmentsPaid: 60, totalInstallments: 60 },
  { id: 'B5', bookingNumber: 'AKG-2025-004', customerId: 'C5', customerName: 'Ayesha Nawaz Butt', plotId: 'S1-Executive Block-001', plotNumber: 'EX-001', societyId: 'S1', societyName: 'Al-Khidmat Heights', block: 'Executive Block', plotSize: '1 Kanal', totalAmount: 13500000, downPayment: 2700000, monthlyInstallment: 180000, remainingBalance: 9720000, bookingDate: '2025-04-18', possessionDate: '2027-04-18', dealerId: 'D2', dealerName: 'Asad Ullah Khan', status: 'active', installmentsPaid: 6, totalInstallments: 60 },
  { id: 'B6', bookingNumber: 'AKG-2025-005', customerId: 'C6', customerName: 'Imran Hussain Gondal', plotId: 'S2-VIP Block-002', plotNumber: 'VIP-002', societyId: 'S2', societyName: 'Green Valley Enclave', block: 'VIP Block', plotSize: '2 Kanal', totalAmount: 22000000, downPayment: 4400000, monthlyInstallment: 293333, remainingBalance: 16266647, bookingDate: '2025-05-01', possessionDate: '2027-05-01', dealerId: 'D4', dealerName: 'Naeem Akhtar', status: 'active', installmentsPaid: 4, totalInstallments: 60 },
  { id: 'B7', bookingNumber: 'AKG-2025-006', customerId: 'C7', customerName: 'Sana Tariq Cheema', plotId: 'S2-Block B-006', plotNumber: 'B-006', societyId: 'S2', societyName: 'Green Valley Enclave', block: 'Block B', plotSize: '7 Marla', totalAmount: 4200000, downPayment: 840000, monthlyInstallment: 56000, remainingBalance: 3024000, bookingDate: '2025-06-12', possessionDate: '2027-06-12', dealerId: 'D1', dealerName: 'Tariq Mahmood', status: 'active', installmentsPaid: 3, totalInstallments: 60 },
  { id: 'B8', bookingNumber: 'AKG-2025-007', customerId: 'C8', customerName: 'Raja Muhammad Usman', plotId: 'S3-Block B-004', plotNumber: 'B-004', societyId: 'S3', societyName: 'Golden Palms Residencia', block: 'Block B', plotSize: '10 Marla', totalAmount: 6800000, downPayment: 1360000, monthlyInstallment: 90667, remainingBalance: 4897218, bookingDate: '2025-07-05', possessionDate: '2027-07-05', dealerId: 'D5', dealerName: 'Adnan Riaz', status: 'active', installmentsPaid: 2, totalInstallments: 60 },
]

export const payments: Payment[] = [
  { id: 'P1', receiptNumber: 'RCP-2025-0001', bookingId: 'B1', bookingNumber: 'AKG-2025-001', customerId: 'C1', customerName: 'Muhammad Asif Khan', societyName: 'Al-Khidmat Heights', plotNumber: 'A-001', amount: 1100000, type: 'down-payment', date: '2025-01-15', status: 'paid', collectedBy: 'Tariq Mahmood', notes: 'Down payment received via bank transfer' },
  { id: 'P2', receiptNumber: 'RCP-2025-0002', bookingId: 'B1', bookingNumber: 'AKG-2025-001', customerId: 'C1', customerName: 'Muhammad Asif Khan', societyName: 'Al-Khidmat Heights', plotNumber: 'A-001', amount: 73333, type: 'installment', date: '2025-02-15', status: 'paid', collectedBy: 'Tariq Mahmood', notes: 'Monthly installment #1' },
  { id: 'P3', receiptNumber: 'RCP-2025-0003', bookingId: 'B2', bookingNumber: 'AKG-2025-002', customerId: 'C2', customerName: 'Fatima Malik', societyName: 'Green Valley Enclave', plotNumber: 'A-003', amount: 560000, type: 'down-payment', date: '2025-02-20', status: 'paid', collectedBy: 'Asad Ullah Khan', notes: 'Down payment received' },
  { id: 'P4', receiptNumber: 'RCP-2025-0004', bookingId: 'B3', bookingNumber: 'AKG-2025-003', customerId: 'C3', customerName: 'Zubair Ahmed Siddiqui', societyName: 'Golden Palms Residencia', plotNumber: 'A-002', amount: 2200000, type: 'down-payment', date: '2025-03-10', status: 'paid', collectedBy: 'Tariq Mahmood', notes: 'Down payment - cash' },
  { id: 'P5', receiptNumber: 'RCP-2025-0005', bookingId: 'B5', bookingNumber: 'AKG-2025-004', customerId: 'C5', customerName: 'Ayesha Nawaz Butt', societyName: 'Al-Khidmat Heights', plotNumber: 'EX-001', amount: 2700000, type: 'down-payment', date: '2025-04-18', status: 'paid', collectedBy: 'Asad Ullah Khan', notes: 'Down payment via cheque' },
  { id: 'P6', receiptNumber: 'RCP-2025-0006', bookingId: 'B6', bookingNumber: 'AKG-2025-005', customerId: 'C6', customerName: 'Imran Hussain Gondal', societyName: 'Green Valley Enclave', plotNumber: 'VIP-002', amount: 4400000, type: 'down-payment', date: '2025-05-01', status: 'paid', collectedBy: 'Naeem Akhtar', notes: 'Down payment received' },
  { id: 'P7', receiptNumber: 'RCP-2025-0007', bookingId: 'B2', bookingNumber: 'AKG-2025-002', customerId: 'C2', customerName: 'Fatima Malik', societyName: 'Green Valley Enclave', plotNumber: 'A-003', amount: 37333, type: 'installment', date: '2025-07-10', status: 'overdue', collectedBy: '', notes: 'Installment #5 - overdue' },
  { id: 'P8', receiptNumber: 'RCP-2025-0008', bookingId: 'B7', bookingNumber: 'AKG-2025-006', customerId: 'C7', customerName: 'Sana Tariq Cheema', societyName: 'Green Valley Enclave', plotNumber: 'B-006', amount: 56000, type: 'installment', date: '2025-07-12', status: 'pending', collectedBy: '', notes: 'Installment #3 due' },
]

export const dealers: Dealer[] = [
  { id: 'D1', name: 'Tariq Mahmood', phone: '0300-3456789', email: 'tariq.m@gmail.com', city: 'Gujranwala', societies: ['S1', 'S3'], totalBookings: 45, totalRevenue: 125000000, commission: 6250000, rating: 4.8, joinDate: '2023-01-10', status: 'active' },
  { id: 'D2', name: 'Asad Ullah Khan', phone: '0321-6543210', email: 'asad.khan@gmail.com', city: 'Lahore', societies: ['S1', 'S2'], totalBookings: 38, totalRevenue: 98000000, commission: 4900000, rating: 4.6, joinDate: '2023-03-15', status: 'active' },
  { id: 'D3', name: 'Bilal Aslam', phone: '0333-2345678', email: 'bilal.aslam@hotmail.com', city: 'Gujranwala', societies: ['S1'], totalBookings: 28, totalRevenue: 62000000, commission: 3100000, rating: 4.4, joinDate: '2023-06-20', status: 'active' },
  { id: 'D4', name: 'Naeem Akhtar', phone: '0345-5678901', email: 'naeem.akhtar@gmail.com', city: 'Sialkot', societies: ['S2'], totalBookings: 32, totalRevenue: 88000000, commission: 4400000, rating: 4.7, joinDate: '2023-09-01', status: 'active' },
  { id: 'D5', name: 'Adnan Riaz', phone: '0311-8901234', email: 'adnan.riaz@gmail.com', city: 'Rawalpindi', societies: ['S3'], totalBookings: 22, totalRevenue: 71500000, commission: 3575000, rating: 4.5, joinDate: '2024-01-05', status: 'active' },
  { id: 'D6', name: 'Waqas Mehmood', phone: '0302-2109876', email: 'waqas.m@yahoo.com', city: 'Faisalabad', societies: ['S2', 'S3'], totalBookings: 15, totalRevenue: 42000000, commission: 2100000, rating: 4.2, joinDate: '2024-04-20', status: 'active' },
]

export const investors: Investor[] = [
  { id: 'I1', name: 'Chaudhry Manzoor Ahmed', phone: '0300-1122334', investmentAmount: 50000000, roi: 18.5, profit: 9250000, projects: ['S1', 'S2'], joinDate: '2023-01-01', status: 'active' },
  { id: 'I2', name: 'Sheikh Muhammad Farooq', phone: '0321-5566778', investmentAmount: 35000000, roi: 16.2, profit: 5670000, projects: ['S2'], joinDate: '2023-04-15', status: 'active' },
  { id: 'I3', name: 'Dr. Rizwan Saleem', phone: '0333-9988776', investmentAmount: 80000000, roi: 20.1, profit: 16080000, projects: ['S1', 'S3'], joinDate: '2022-12-10', status: 'active' },
  { id: 'I4', name: 'Haji Shafiq ur Rehman', phone: '0345-4433221', investmentAmount: 25000000, roi: 14.8, profit: 3700000, projects: ['S1'], joinDate: '2023-08-20', status: 'active' },
  { id: 'I5', name: 'Mrs. Rukhsana Anwar', phone: '0311-7766554', investmentAmount: 15000000, roi: 15.5, profit: 2325000, projects: ['S3'], joinDate: '2024-02-14', status: 'active' },
]

export const monthlyRevenue = [
  { month: 'Aug', revenue: 18500000, bookings: 12, payments: 24 },
  { month: 'Sep', revenue: 22300000, bookings: 15, payments: 31 },
  { month: 'Oct', revenue: 19800000, bookings: 13, payments: 28 },
  { month: 'Nov', revenue: 28600000, bookings: 19, payments: 38 },
  { month: 'Dec', revenue: 31200000, bookings: 21, payments: 45 },
  { month: 'Jan', revenue: 24500000, bookings: 16, payments: 32 },
  { month: 'Feb', revenue: 27800000, bookings: 18, payments: 37 },
  { month: 'Mar', revenue: 33100000, bookings: 22, payments: 48 },
  { month: 'Apr', revenue: 29600000, bookings: 20, payments: 41 },
  { month: 'May', revenue: 38200000, bookings: 25, payments: 54 },
  { month: 'Jun', revenue: 35400000, bookings: 23, payments: 49 },
  { month: 'Jul', revenue: 41800000, bookings: 28, payments: 58 },
]

export const recentActivity = [
  { id: 1, type: 'booking', text: 'New booking by Muhammad Asif Khan — A-001, Al-Khidmat Heights', time: '2 hours ago', color: '#0F766E' },
  { id: 2, type: 'payment', text: 'Payment of PKR 73,333 received from Fatima Malik', time: '4 hours ago', color: '#2563EB' },
  { id: 3, type: 'society', text: 'Golden Palms Residencia status updated to Pre-Launch', time: '6 hours ago', color: '#C9A227' },
  { id: 4, type: 'customer', text: 'New customer registered: Raja Muhammad Usman', time: '1 day ago', color: '#7C3AED' },
  { id: 5, type: 'payment', text: 'Overdue notice sent to Fatima Malik — Installment #5', time: '1 day ago', color: '#DC2626' },
  { id: 6, type: 'booking', text: 'Booking completed for Hafiz Abdul Razzaq — C-008', time: '2 days ago', color: '#0F766E' },
  { id: 7, type: 'transfer', text: 'Plot VIP-002 transfer initiated by Imran Hussain Gondal', time: '3 days ago', color: '#D97706' },
]

export const notifications = [
  { id: 1, title: 'Payment Due', message: 'Fatima Malik — Installment #5 overdue by 11 days', type: 'warning', time: '2h ago' },
  { id: 2, title: 'New Booking', message: 'Raja Muhammad Usman booked Plot B-004', type: 'success', time: '4h ago' },
  { id: 3, title: 'Possession Due', message: 'Hafiz Abdul Razzaq — possession date approaching June 2026', type: 'info', time: '1d ago' },
  { id: 4, title: 'Plot Sold', message: 'Plot EX-003 in Executive Block successfully transferred', type: 'success', time: '2d ago' },
]

export function formatPKR(amount: number): string {
  if (amount >= 10000000) return `${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)} L`
  return amount.toLocaleString('en-PK')
}

export function formatPKRFull(amount: number): string {
  return 'PKR ' + amount.toLocaleString('en-PK')
}
