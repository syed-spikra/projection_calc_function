export async function calculateProjectMetrics(inputData) {
    const {
      startDate,
      workHours,
      totalProjectHours,
      profitTarget,
      teamMemberCount,
      workWeekDays,
      teamMembers
    } = inputData;
  
    // 1. Team Daily capacity
    const teamDailyCapacity = teamMembers.reduce((sum, member) => sum + member.hours_day, 0);
  
    // 2. Projected duration
    let projectedDuration = totalProjectHours / teamDailyCapacity;
    projectedDuration = projectedDuration.toFixed(1);
    // console.log(projectedDuration);
    // 3. Projected end date
    const projectedDurationDays = Math.ceil(projectedDuration);
  let projectedEndDate;
  let currentDate = new Date(startDate);
  let workingDaysCounted = 0;

  while (workingDaysCounted < projectedDurationDays) {
    const dayOfWeek = currentDate.getDay();
    let isWorkingDay = false;

    if (workWeekDays === '6') {
      isWorkingDay = dayOfWeek !== 0; // Exclude Sundays
    } else if (workWeekDays === '5') {
      isWorkingDay = dayOfWeek !== 0 && dayOfWeek !== 6; // Exclude Saturdays and Sundays
    }

    if (isWorkingDay) {
      workingDaysCounted++;
      if (workingDaysCounted === projectedDurationDays) {
        projectedEndDate = new Date(currentDate);
        break;
      }
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Format projectedEndDate
  const endDateFormatted = projectedEndDate ? projectedEndDate.toISOString().split('T')[0] : 'N/A';

  
    // 4. Team costs
    const teamCosts = teamMembers.reduce(
      (sum, member) => sum + member.hours_day * projectedDuration * member.cost_rate,
      0
    );
  
    // 9. Team cost breakdown json
    const memberCostBreakdown = teamMembers.map(member => {
      const totalHours = projectedDuration * member.hours_day;
      const memberCost = member.cost_rate * totalHours;
      return {
        id: member.id,
        name: member.name,
        role: member.role,
        cost_rate: member.cost_rate,
        total_hours: totalHours,
        member_cost: memberCost,
      };
    });
  
    const totalCostsBreakdown = memberCostBreakdown.reduce((sum, member) => sum + member.member_cost, 0);
  
    // 5. Revenue breakdown json
    const memberRevenueBreakdown = teamMembers.map(member => {
      const billableHours = ((member.hours_day * projectedDuration) * (member.billable_ratio / 100));
      // const billableHours = totalProjectHours * (member.billable_ratio / 100);
      const revenue = member.billable_rate * billableHours;
      return {
        id: member.id,
        name: member.name,
        role: member.role,
        billable_rate: member.billable_rate,
        billable_ratio: member.billable_ratio,
        billable_hours: billableHours,
        revenue: revenue,
      };
    });
  
    const totalRevenue = memberRevenueBreakdown.reduce((sum, member) => sum + member.revenue, 0);
  
    // 6. main_revenue
    const expectedProfitRevenue = teamCosts / (1 - (profitTarget / 100));
    const mainRevenue = expectedProfitRevenue > totalRevenue ? expectedProfitRevenue : totalRevenue;
  
    // 7. profitorloss
    const profitLoss = mainRevenue - teamCosts;
  
    // 8. profit_margin
    const profitMargin = (profitLoss / mainRevenue) * 100;
  
    // 10. average billable ratio
    const averageBillableRatio = teamMembers.reduce((sum, member) => sum + member.billable_ratio, 0) / teamMembers.length;

  // 9. Team cost breakdown json
    return {
      teamDailyCapacity: parseFloat(teamDailyCapacity),
      projectedDuration: parseFloat(projectedDuration),
      projectedEndDate: endDateFormatted,
      averageBillableRatio: parseFloat(averageBillableRatio),
      teamCosts: parseFloat(teamCosts),
      teamCostBreakdown: {
        memberCostBreakdown: memberCostBreakdown.map(member => ({
          ...member,
          total_hours: parseFloat(member.total_hours),
          member_cost: parseFloat(member.member_cost),
        })),
        totalCosts: parseFloat(totalCostsBreakdown),
      },
      revenueBreakdown: {
        memberRevenueBreakdown: memberRevenueBreakdown.map(member => ({
          ...member,
          billable_hours: parseFloat(member.billable_hours),
          revenue: parseFloat(member.revenue),
        })),
        totalRevenue: parseFloat(totalRevenue),
      },
      mainRevenue: parseFloat(mainRevenue),
      profitLoss: parseFloat(profitLoss),
      profitMargin: parseFloat(profitMargin),
    };
  }
  
// Example usage with your input data:
  // const inputData = {
  //   startDate: '2025-03-29',
  //   workHours: 8,
  //   totalProjectHours: 80,
  //   profitTarget: 20,
  //   teamMemberCount: 2,
  //   workWeekDays: '5',
  //   teamMembers: [
  //     {
  //       id: 'memb1',
  //       name: 'Syed',
  //       role: 'TL',
  //       department: 'Product',
  //       hours_day: 3,
  //       cost_rate: 90,
  //       billable_rate: 40,
  //       billable_ratio: 100
  //     },
  //     {
  //       id: 'memb2',
  //       name: 'Guna',
  //       role: 'member',
  //       department: 'Design',
  //       hours_day: 2,
  //       cost_rate: 70,
  //       billable_rate: 40,
  //       billable_ratio: 90
  //     }
  //   ]
  // };


//   const outputData = calculateProjectMetrics(inputData);
//   console.log(JSON.stringify(outputData, null, 2));


// export default calculateProjectMetrics;
